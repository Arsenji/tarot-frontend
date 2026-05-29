'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiEndpoint } from '@/utils/config';
import { getValidAuthToken } from '@/utils/auth';

// Максимум опросов статуса (~60 сек при интервале 2 сек),
// чтобы страница не зависала бесконечно, если платёж не оплачен.
const MAX_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 2000;

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'canceled' | 'timeout'>('checking');
  const [message, setMessage] = useState('Проверяем статус платежа...');
  const attemptsRef = useRef(0);
  const cancelledRef = useRef(false);

  const goBack = () => {
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg?.close) {
      tg.close();
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    cancelledRef.current = false;

    const checkPaymentStatus = async () => {
      if (cancelledRef.current) return;
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
          setMessage('Ошибка авторизации. Вернитесь в приложение и проверьте баланс.');
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
          setMessage('Токены начислены');
          setTimeout(goBack, 2500);
        } else if (data.payment?.status === 'canceled') {
          setStatus('canceled');
          setMessage('Платёж отменён. Токены не списаны.');
        } else if (data.payment?.status === 'pending') {
          attemptsRef.current += 1;
          if (attemptsRef.current >= MAX_ATTEMPTS) {
            setStatus('timeout');
            setMessage('Платёж пока не подтверждён. Если вы оплатили — баланс обновится автоматически в течение пары минут.');
            return;
          }
          setStatus('checking');
          setMessage('Ожидаем подтверждение');
          setTimeout(checkPaymentStatus, POLL_INTERVAL_MS);
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

    return () => {
      cancelledRef.current = true;
    };
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

          {(status === 'canceled' || status === 'timeout') && (
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
            {status === 'timeout' && 'Платёж не подтверждён'}
          </h1>

          <p className="text-gray-300 text-center">
            {message}
          </p>

          <Button
            onClick={goBack}
            className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-300"
          >
            Вернуться в приложение
          </Button>
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
