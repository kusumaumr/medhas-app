import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Linking, Platform, Alert, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { Card, TextInput, SegmentedButtons, Button, FAB } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { getContacts, addContact, deleteContact } from '../services/StorageService';
import { useLanguage } from '../services/LanguageContext';

const CareNetworkScreen = ({ onGoBack }) => {
    const { t } = useLanguage();
    const [contacts, setContacts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [name, setName] = useState('');
    const [role, setRole] = useState('family');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [relationship, setRelationship] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Roles based on language
    const getRoles = () => [
        { value: 'doctor', label: t('roles.doctor'), icon: 'stethoscope', color: '#3b82f6' },
        { value: 'family', label: t('roles.family'), icon: 'account-group', color: '#10b981' },
        { value: 'emergency', label: t('roles.emergency'), icon: 'alert-circle', color: '#ef4444' },
        { value: 'pharmacy', label: t('roles.pharmacy'), icon: 'medical-bag', color: '#8b5cf6' },
    ];

    const ROLES = getRoles();

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        const data = await getContacts();
        setContacts(data);
    };

    const handleAddContact = async () => {
        if (!name.trim()) {
            Alert.alert(t('error') || 'Error', t('contactNameRequired'));
            return;
        }
        if (!phone.trim() && !email.trim()) {
            Alert.alert(t('error') || 'Error', t('contactPhoneOrEmailRequired'));
            return;
        }

        setIsSubmitting(true);
        const roleData = ROLES.find(r => r.value === role);

        const contact = {
            name: name.trim(),
            role: roleData.label,
            roleType: role,
            phone: phone.trim(),
            email: email.trim(),
            relationship: relationship.trim(),
            color: roleData.color,
            isEmergency: role === 'emergency',
        };

        const result = await addContact(contact);
        setIsSubmitting(false);

        if (result) {
            Alert.alert(t('success') || 'Success', t('contactAddedSuccess'));
            setName('');
            setRole('family');
            setPhone('');
            setEmail('');
            setRelationship('');
            setShowAddForm(false);
            loadContacts();
        } else {
            Alert.alert(t('error') || 'Error', t('failedToAddEntry'));
        }
    };

    const handleCall = (phoneNumber) => {
        if (!phoneNumber) {
            Alert.alert(t('error') || 'Error', t('noPhone'));
            return;
        }

        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
        const telUrl = `tel:${cleanNumber}`;

        if (Platform.OS === 'web') {
            try {
                // Use window.open for web to avoid popup blockers if possible, or location.href
                window.location.href = telUrl;
            } catch (e) {
                console.error('Web call error:', e);
                Alert.alert(t('error') || 'Error', t('callFailed'));
            }
        } else {
            Linking.canOpenURL(telUrl)
                .then((supported) => {
                    if (!supported) {
                        Alert.alert(t('error') || 'Error', t('callNotSupported') || 'Phone calling is not supported on this device');
                    } else {
                        return Linking.openURL(telUrl);
                    }
                })
                .catch((err) => console.error('Call error:', err));
        }
    };

    const handleEmail = (emailAddress) => {
        if (!emailAddress) {
            Alert.alert(t('error') || 'Error', t('noEmail'));
            return;
        }

        console.log('📧 [Email] Opening email client for:', emailAddress);

        const mailtoUrl = `mailto:${emailAddress}`;

        Linking.canOpenURL(mailtoUrl)
            .then((supported) => {
                console.log('📧 [Email] Can open mailto URL:', supported);
                if (supported) {
                    return Linking.openURL(mailtoUrl);
                } else {
                    console.warn('📧 [Email] mailto: links not supported');
                    Alert.alert(
                        t('sendEmail'),
                        `${emailAddress}\n\n${t('copyEmail')}`,
                        [{ text: t('ok') }]
                    );
                }
            })
            .then(() => {
                console.log('📧 [Email] Successfully opened email client');
            })
            .catch((err) => {
                console.error('📧 [Email] Error:', err);
                Alert.alert(
                    t('error') || 'Error',
                    `${t('emailNotSupported')}\n\nEmail: ${emailAddress}`,
                    [{ text: t('ok') }]
                );
            });
    };

    const handleDelete = async (id) => {
        // Direct delete without confirmation as requested by user
        try {
            await deleteContact(id);
            loadContacts();
            // Show brief success message
            if (Platform.OS !== 'web') {
                Alert.alert(t('delete'), t('contactDeleted'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert(t('error') || 'Error', t('failedToDeleteContact'));
        }
    };

    const emergencyContacts = contacts.filter(c => c.isEmergency);
    const regularContacts = contacts.filter(c => !c.isEmergency);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {onGoBack && (
                        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                            <Icon name="arrow-left" size={24} color="#0f172a" />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.title}>{t('careNetwork')}</Text>
                        <Text style={styles.subtitle}>{contacts.length} {t('regularContacts').toLowerCase()}</Text>
                    </View>
                </View>
            </View>

            {showAddForm ? (
                <Card style={styles.addCard} elevation={3}>
                    <Card.Content>
                        <Text style={styles.formTitle}>{t('addNewContact')}</Text>

                        <TextInput
                            label={`${t('contactName')} *`}
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                        />

                        <Text style={styles.label}>{t('contactRole')}</Text>
                        <SegmentedButtons
                            value={role}
                            onValueChange={setRole}
                            buttons={ROLES.map(r => ({ value: r.value, label: r.label }))}
                            style={styles.segmented}
                        />

                        <TextInput
                            label={t('contactPhone')}
                            value={phone}
                            onChangeText={setPhone}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            label={t('contactEmail')}
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            style={styles.input}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TextInput
                            label={t('contactRelationship')}
                            value={relationship}
                            onChangeText={setRelationship}
                            mode="outlined"
                            style={styles.input}
                            placeholder={`e.g., ${t('roles.doctor')}, ${t('roles.family')}`}
                        />

                        <View style={styles.formActions}>
                            <Button mode="outlined" onPress={() => setShowAddForm(false)} style={styles.formButton}>
                                {t('cancel')}
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleAddContact}
                                style={[styles.formButton, styles.submitButton]}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                {t('addContact')}
                            </Button>
                        </View>
                    </Card.Content>
                </Card>
            ) : null}

            <ScrollView style={styles.contacts} contentContainerStyle={styles.scrollContent}>
                {emergencyContacts.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>{t('emergencyContacts')}</Text>
                        {emergencyContacts.map((contact) => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                onCall={handleCall}
                                onEmail={handleEmail}
                                onDelete={handleDelete}
                                t={t}
                            />
                        ))}
                    </View>
                )}

                {regularContacts.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>{t('regularContacts')}</Text>
                        {regularContacts.map((contact) => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                onCall={handleCall}
                                onEmail={handleEmail}
                                onDelete={handleDelete}
                                t={t}
                            />
                        ))}
                    </View>
                )}

                {contacts.length === 0 && (
                    <View style={styles.emptyState}>
                        <Icon name="account-group-outline" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>{t('noContacts')}</Text>
                        <Text style={styles.emptySubtext}>{t('addContactsHelp')}</Text>
                    </View>
                )}

                {/* Button at the end of page content */}
                <View style={styles.fabContainer}>
                    <FAB
                        icon={showAddForm ? "close" : "plus"}
                        style={styles.fabInline}
                        onPress={() => setShowAddForm(!showAddForm)}
                        label={Platform.OS === 'web' && !showAddForm ? t('addContact') : undefined}
                    />
                </View>
            </ScrollView>
        </View >
    );
};

const ContactCard = ({ contact, onCall, onEmail, onDelete, t }) => {
    const roleIcon = (contact.roleType === 'doctor' ? 'stethoscope' :
        contact.roleType === 'family' ? 'account-group' :
            contact.roleType === 'emergency' ? 'alert-circle' :
                contact.roleType === 'pharmacy' ? 'medical-bag' : 'account');

    // Display translation logic
    const displayRole = contact.roleType ? t(`roles.${contact.roleType}`) : contact.role;

    return (
        <Card style={styles.contactCard} elevation={2}>
            <Card.Content>
                <View style={styles.contactHeader}>
                    <TouchableOpacity
                        style={[styles.contactIcon, { backgroundColor: contact.color + '20' }]}
                        onPress={() => contact.phone && onCall(contact.phone)}
                    >
                        <Icon name={roleIcon} size={24} color={contact.color} />
                    </TouchableOpacity>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactRole}>{displayRole}</Text>
                        {contact.relationship ? (
                            <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                        ) : null}
                    </View>
                    <TouchableOpacity onPress={() => onDelete(contact.id)} style={styles.deleteBtn}>
                        <Icon name="delete-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                <View style={styles.contactActions}>
                    {contact.phone && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => onCall(contact.phone)}
                        >
                            <Icon name="phone" size={18} color="#10b981" />
                            <Text style={styles.actionText}>{contact.phone}</Text>
                        </TouchableOpacity>
                    )}
                    {contact.email && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => onEmail(contact.email)}
                        >
                            <Icon name="email" size={18} color="#3b82f6" />
                            <Text style={styles.actionText}>{contact.email}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Card.Content>
        </Card>
    );
};

// Use Pressable for better cross-platform support
const TouchableOpacity = Platform.OS === 'web'
    ? ({ children, onPress, style }) => {
        // Flatten styles if it's an array, and convert to object
        const flattenedStyle = StyleSheet.flatten(style) || {};

        const webStyle = {
            ...flattenedStyle,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            display: 'flex', // Ensure flex layout works
        };

        return (
            <div
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onPress) onPress();
                }}
                style={webStyle}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onPress) onPress();
                    }
                }}
            >
                {children}
            </div>
        );
    }
    : RNTouchableOpacity;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 24,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    addCard: {
        marginHorizontal: 24,
        marginBottom: 16,
        borderRadius: 12,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        marginBottom: 12,
    },
    segmented: {
        marginBottom: 16,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    formButton: {
        flex: 1,
    },
    submitButton: {
        backgroundColor: '#10b981',
    },
    contacts: {
        flex: 1,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginTop: 8,
        marginBottom: 12,
    },
    contactCard: {
        marginBottom: 16,
        borderRadius: 12,
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
    },
    contactRole: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    contactRelationship: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    deleteBtn: {
        padding: 8,
    },
    contactActions: {
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    actionText: {
        fontSize: 14,
        color: '#475569',
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        backgroundColor: '#10b981',
    },
    fabCentered: {
        bottom: 200,
        left: 0,
        right: 0,
        marginHorizontal: 'auto',
        alignSelf: 'center',
    },
    fabBottomRight: {
        bottom: 0,
        alignSelf: 'center',
        margin: 0,
        marginBottom: 10,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    fabContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    fabInline: {
        backgroundColor: '#10b981',
    },
});

export default CareNetworkScreen;
