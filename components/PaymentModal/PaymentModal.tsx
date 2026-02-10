"use client"

import { createCryptoPayment, createLuxfintechPayment } from '@/app/actions/payments/payments';
import { type PaymentMethod } from '@/app/actions/payments/products';
import { Modal, Text, Group, Stack, Divider, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconCreditCard,
    IconBrandPaypal,
    IconCurrencyDollar,
    IconCoin,
    IconArrowRight,
} from '@tabler/icons-react';
import { useState } from 'react';

interface PaymentModalProps {
    opened: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    price: string;
}

const paymentMethods: {
    id: PaymentMethod;
    label: string;
    sublabel: string;
    icon: typeof IconCreditCard;
    iconColor: string;
    bgGradient: string;
    borderColor: string;
}[] = [
        {
            id: 'card',
            label: 'Credit / Debit Card',
            sublabel: 'Visa, Mastercard & more',
            icon: IconCreditCard,
            iconColor: '#60a5fa',
            bgGradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)',
            borderColor: 'rgba(96, 165, 250, 0.25)',
        },
        {
            id: 'paypal',
            label: 'PayPal',
            sublabel: 'Pay with your PayPal account',
            icon: IconBrandPaypal,
            iconColor: '#0070ba',
            bgGradient: 'linear-gradient(135deg, rgba(0, 112, 186, 0.12) 0%, rgba(0, 48, 135, 0.06) 100%)',
            borderColor: 'rgba(0, 112, 186, 0.25)',
        },
        {
            id: 'venmo',
            label: 'Venmo',
            sublabel: 'Fast and easy Venmo payment',
            icon: IconCurrencyDollar,
            iconColor: '#3d95ce',
            bgGradient: 'linear-gradient(135deg, rgba(61, 149, 206, 0.12) 0%, rgba(61, 149, 206, 0.06) 100%)',
            borderColor: 'rgba(61, 149, 206, 0.25)',
        },
        {
            id: 'crypto',
            label: 'Cryptocurrency',
            sublabel: 'Bitcoin, Ethereum & 100+ coins',
            icon: IconCoin,
            iconColor: '#f59e0b',
            bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
            borderColor: 'rgba(245, 158, 11, 0.25)',
        },
    ];

export function PaymentModal({ opened, onClose, productId, productName, price }: PaymentModalProps) {
    const [processingMethod, setProcessingMethod] = useState<PaymentMethod | null>(null);

    const handlePayment = async (method: PaymentMethod) => {
        try {
            setProcessingMethod(method);

            notifications.show({
                id: 'payment-processing',
                title: 'Creating Payment',
                message: `Setting up your ${method} payment...`,
                loading: true,
                autoClose: false,
                withCloseButton: false,
            });

            let result;

            if (method === 'crypto') {
                result = await createCryptoPayment(productId);
            } else {
                result = await createLuxfintechPayment(productId, method);
            }

            notifications.hide('payment-processing');

            if (result.success && result.redirectUrl) {
                notifications.show({
                    title: 'Redirecting to Payment',
                    message: 'You will be redirected to complete your payment...',
                    color: 'green',
                    autoClose: 2000,
                });
                // Redirect to payment URL
                window.location.href = result.redirectUrl;
            } else {
                setProcessingMethod(null);
                notifications.show({
                    title: 'Payment Error',
                    message: result.error || 'Failed to create payment',
                    color: 'red',
                });
            }
        } catch (error: any) {
            setProcessingMethod(null);
            notifications.hide('payment-processing');
            notifications.show({
                title: 'Error',
                message: error.message || 'Something went wrong',
                color: 'red',
            });
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={() => { if (!processingMethod) onClose(); }}
            title={
                <div>
                    <Text fw={700} fz={18}>Choose Payment Method</Text>
                    <Text c="dimmed" fz={13} mt={2}>{productName} — {price}</Text>
                </div>
            }
            size="md"
            centered
            radius="lg"
            overlayProps={{ backgroundOpacity: 0.6, blur: 4 }}
            styles={{
                content: {
                    background: 'linear-gradient(160deg, rgba(17, 17, 30, 0.98) 0%, rgba(25, 25, 45, 0.98) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                },
                header: {
                    background: 'transparent',
                },
                title: {
                    width: '100%',
                },
            }}
        >
            <Stack gap={10} mt={4}>
                {paymentMethods.map((method) => {
                    const isProcessing = processingMethod === method.id;
                    const isDisabled = processingMethod !== null && !isProcessing;

                    return (
                        <button
                            key={method.id}
                            onClick={() => handlePayment(method.id)}
                            disabled={isDisabled}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: `1px solid ${isProcessing ? method.iconColor : method.borderColor}`,
                                background: method.bgGradient,
                                color: '#fff',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.4 : 1,
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                            }}
                            onMouseEnter={(e) => {
                                if (!isDisabled) {
                                    e.currentTarget.style.borderColor = method.iconColor;
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isProcessing) {
                                    e.currentTarget.style.borderColor = method.borderColor;
                                }
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: `${method.iconColor}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <method.icon size={22} color={method.iconColor} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: 600 }}>
                                    {method.label}
                                </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                                    {method.sublabel}
                                </div>
                            </div>

                            {isProcessing ? (
                                <Loader size={18} color={method.iconColor} />
                            ) : (
                                <IconArrowRight size={18} color="#6b7280" style={{ flexShrink: 0 }} />
                            )}
                        </button>
                    );
                })}
            </Stack>

            <Divider my="md" color="rgba(255,255,255,0.08)" />

            <Text c="dimmed" fz={11} ta="center" style={{ lineHeight: 1.5 }}>
                All payments are securely processed. You will be redirected to complete your payment.
            </Text>
        </Modal>
    );
}
