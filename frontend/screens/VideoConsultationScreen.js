import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Dimensions } from 'react-native';
import { io } from 'socket.io-client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createElement } from 'react-native'; // On web, this allows rendering HTML elements

// --- Web-Specific Video Component ---
// This safely renders a <video> tag on web and a View on native (placeholder)
const VideoStream = ({ stream, isLocal, style }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (Platform.OS === 'web') {
        return createElement('video', {
            ref: videoRef,
            autoPlay: true,
            playsInline: true,
            muted: isLocal, // Mute local video to avoid feedback
            style: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: isLocal ? 'scaleX(-1)' : 'none', // Mirror local video
                ...style // Apply RN styles (converted to CSS by RNW)
            }
        });
    }

    // Fallback for Native (since we didn't install react-native-webrtc yet)
    return (
        <View style={[styles.videoPlaceholder, style]}>
            <Text style={{ color: 'white' }}>Video only supported on Web for now (Native requires build)</Text>
        </View>
    );
};

const VideoConsultationScreen = ({ navigation }) => {
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isInCall, setIsInCall] = useState(false);
    const [status, setStatus] = useState('Initializing...');

    const peerConnection = useRef(null);
    // Default STUN servers
    const servers = {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
            },
        ],
    };

    // Use dynamic room ID from URL or default
    const getRoomId = () => {
        if (Platform.OS === 'web') {
            const params = new URLSearchParams(window.location.search);
            return params.get('roomId') || 'consultation-room-1';
        }
        return 'consultation-room-1';
    };
    const ROOM_ID = getRoomId();

    useEffect(() => {
        // 1. Initialize Socket
        // Use localhost for local testing, or correct IP if running on device
        const backendUrl = 'http://localhost:5000';
        const newSocket = io(backendUrl);
        socketRef.current = newSocket;
        setSocket(newSocket);
        setStatus('Connected to Signaling Server');

        // 2. Setup Signaling Listeners
        newSocket.on('connect', () => {
            console.log('✅ Connected to Signaling Server');
        });

        newSocket.on('user-connected', async (userId) => {
            console.log('👤 User connected:', userId);
            setStatus('User joined. Initiating offer...');
            createOffer();
        });

        newSocket.on('offer', async (offer) => {
            console.log('Offer received');
            setStatus('Received Offer. Answering...');
            createAnswer(offer);
        });

        newSocket.on('answer', async (answer) => {
            console.log('Answer received');
            setStatus('Received Answer. Connecting...');
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(answer);
            }
        });

        newSocket.on('ice-candidate', async (candidate) => {
            console.log('ICE Candidate received');
            if (peerConnection.current && candidate) {
                // Need to ensure remote description is set before adding candidate
                try {
                    await peerConnection.current.addIceCandidate(candidate);
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });

        return () => {
            newSocket.disconnect();
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
        };
    }, []);

    const startLocalStream = async () => {
        try {
            if (Platform.OS !== 'web') {
                Alert.alert("Platform Error", "This feature is currently available on Web only.");
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            Alert.alert('Error', 'Could not access camera/microphone.');
            return null;
        }
    };

    const createPeerConnection = (stream) => {
        const pc = new RTCPeerConnection(servers);

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log('Remote stream received');
            setRemoteStream(event.streams[0]);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', { roomId: ROOM_ID, candidate: event.candidate });
            }
        };

        peerConnection.current = pc;
        return pc;
    };

    const joinRoom = async () => {
        const stream = await startLocalStream();
        if (!stream) return;

        createPeerConnection(stream);

        setIsInCall(true);

        setStatus('Joining Room...');
        if (socketRef.current) {
            socketRef.current.emit('join-room', ROOM_ID, 'user-' + Math.floor(Math.random() * 1000));
        }
    };

    const createOffer = async () => {
        if (!peerConnection.current) return;

        try {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            if (socketRef.current) {
                socketRef.current.emit('offer', { roomId: ROOM_ID, offer });
            }
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    };

    const createAnswer = async (offer) => {
        // If we receive an offer but haven't started local stream yet (callee side logic simplification)
        // Ideally we should auto-start or prompt. For now assuming we clicked "Join" already? 
        // Wait, if we are the second person joining, we might not have a PC yet if we didn't click Join.
        // Simplifying: User clicks "Start Consultation" to set up their side. 
        // Actually, "user-connected" event triggers the EXISTING user to send offer. 
        // The NEW user receives the offer. 

        if (!localStream) {
            // Just in case
            const stream = await startLocalStream();
            createPeerConnection(stream);
        }

        const pc = peerConnection.current;
        await pc.setRemoteDescription(offer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socketRef.current) {
            socketRef.current.emit('answer', { roomId: ROOM_ID, answer });
        }
    };

    const endCall = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsInCall(false);
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Doctor Consultation</Text>
                <Text style={styles.statusText}>{status}</Text>
            </View>

            <View style={styles.videoContainer}>
                {/* Remote Video (Full Screen) */}
                {remoteStream ? (
                    <View style={styles.remoteVideo}>
                        <VideoStream stream={remoteStream} isLocal={false} style={{ width: '100%', height: '100%' }} />
                    </View>
                ) : (
                    <View style={styles.remotePlaceholder}>
                        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 20 }}>Waiting for doctor to join...</Text>

                        {isInCall && (
                            <View style={styles.inviteContainer}>
                                <Text style={{ color: '#aaa', marginBottom: 10, textAlign: 'center' }}>
                                    Share this link with the doctor (or your other device) to connect:
                                </Text>
                                {/* Show the link explicitly */}
                                <View style={{ backgroundColor: '#000', padding: 8, borderRadius: 4, marginBottom: 10 }}>
                                    <Text style={{ color: '#4ade80', fontSize: 12 }} selectable={true}>
                                        {Platform.OS === 'web'
                                            ? `${window.location.origin}${window.location.pathname}?roomId=${ROOM_ID}`
                                            : `Room ID: ${ROOM_ID}`
                                        }
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.inviteButton}
                                    onPress={() => {
                                        const url = Platform.OS === 'web'
                                            ? `${window.location.origin}${window.location.pathname}?roomId=${ROOM_ID}`
                                            : ROOM_ID;
                                        navigator.clipboard.writeText(url);
                                        Alert.alert("Link Copied", "Send this link to the other person!");
                                    }}
                                >
                                    <MaterialCommunityIcons name="content-copy" size={20} color="white" />
                                    <Text style={styles.inviteButtonText}>Copy Invite Link</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.inviteButton, { backgroundColor: '#3b82f6', marginTop: 10 }]}
                                    onPress={() => {
                                        setStatus('Manually connecting...');
                                        createOffer();
                                    }}
                                >
                                    <MaterialCommunityIcons name="refresh" size={20} color="white" />
                                    <Text style={styles.inviteButtonText}>Force Connect</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Local Video (Floating PiP) */}
                {localStream && (
                    <View style={styles.localVideo}>
                        <VideoStream stream={localStream} isLocal={true} style={{ width: 100, height: 150 }} />
                    </View>
                )}
            </View>

            <View style={styles.controls}>
                {!isInCall ? (
                    <TouchableOpacity style={styles.joinButton} onPress={joinRoom}>
                        <MaterialCommunityIcons name="video" size={30} color="white" />
                        <Text style={styles.buttonText}>Start Consultation</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.endButton} onPress={endCall}>
                        <MaterialCommunityIcons name="phone-hangup" size={30} color="white" />
                        <Text style={styles.buttonText}>End Call</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
    },
    headerText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statusText: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 5,
    },
    videoContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden', // Contain video
    },
    remoteVideo: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    remotePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
    },
    inviteContainer: {
        padding: 20,
        backgroundColor: '#333',
        borderRadius: 10,
        alignItems: 'center',
        maxWidth: '80%',
    },
    inviteButton: {
        marginTop: 10,
        backgroundColor: '#4ade80',
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    inviteButtonText: {
        color: '#000', // Black text on green button for contrast
        fontWeight: 'bold',
        marginLeft: 8,
    },
    localVideo: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 100,
        height: 150,
        backgroundColor: '#333',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 10,
    },
    videoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
    },
    controls: {
        padding: 30,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    joinButton: {
        backgroundColor: '#4a90e2',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 50,
    },
    endButton: {
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 50,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default VideoConsultationScreen;
