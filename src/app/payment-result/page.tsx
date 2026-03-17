'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiEndpoint } from '@/utils/config';
import { getValidAuthToken } from '@/utils/auth';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'canceled'>('checking');
  const [message, setMessage] = useState('Проверяем статус платежа...');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const paymentId = searchParams?.get('paymentId') ||
                         searchParams?.get('payment_id') ||
                         searchParams?.get('orderId') ||
                         searchParams?.get('order_id');

        if (!paymentId) {
          setStatus('error');
          setMessage('Ошибка: платеж не найден');
          return;
        }

        const token = await getValidAuthToken();
        if (!token) {
          setStatus('error');
          setMessage('Ошибка авторизации. Попробуйте вернуться в приложение.');
          return;
        }

        const endpoint = getApiEndpoint(`/payment/status/${paymentId}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            setStatus('error');
            setMessage('Ошибка: платеж не найден');
            return;
          }
          throw new Error(`Failed to check payment status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.payment?.paid) {
          setStatus('success');
          setMessage('Подписка активирована');
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
              (window as any).Telegram.WebApp.close();
            } else {
              router.push('/');
            }
          }, 3000);
        } else if (data.payment?.status === 'pending') {
          setStatus('checking');
          setMessage('Ожидаем подтверждение');
          setTimeout(checkPaymentStatus, 2000);
        } else if (data.payment?.status === 'canceled') {
          setStatus('canceled');
          setMessage('Платеж отменён');
        } else {
          setStatus('error');
          setMessage('Платёж не завершён. Если деньги списались, обратитесь в поддержку.');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
        setMessage('Произошла ошибка при проверке статуса платежа.');
      }
    };

    checkPaymentStatus();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-slate-600/30 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center space-y-6">
          {status === 'checking' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-16 h-16 text-amber-400" />
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <XCircle className="w-16 h-16 text-red-400" />
            </motion.div>
          )}

          {status === 'canceled' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <Ban className="w-16 h-16 text-amber-500" />
            </motion.div>
          )}

          <h1 className="text-2xl font-bold text-white text-center">
            {status === 'checking' && 'Проверяем платёж...'}
            {status === 'success' && 'Успешно!'}
            {status === 'error' && 'Что-то пошло не так'}
            {status === 'canceled' && 'Платеж отменён'}
          </h1>

          <p className="text-gray-300 text-center">
            {message}
          </p>

          {status !== 'checking' && (
            <Button
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                  (window as any).Telegram.WebApp.close();
                } else {
                  router.push('/');
                }
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-300"
            >
              Вернуться в приложение
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-slate-600/30 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-16 h-16 text-amber-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white text-center">
            Загрузка...
          </h1>
          <p className="text-gray-300 text-center">
            Подготавливаем страницу оплаты
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentResultContent />
    </Suspense>
  );
}
