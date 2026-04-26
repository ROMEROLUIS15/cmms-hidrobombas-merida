import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CheckCircle, AlertTriangle, Mail, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmailToken();
    } else {
      setStatus('error');
      setMessage('Token de verificación no válido');
      setLoading(false);
    }
  }, [token]);

  const verifyEmailToken = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/auth/verify-email/${token}`);
      
      setStatus('success');
      setMessage(response.data.message);
      toast.success('¡Email verificado exitosamente!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Error al verificar el email';
      setStatus('error');
      setMessage(errorMessage);
      
      if (errorMessage.includes('expirado')) {
        setStatus('expired');
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    setResendLoading(true);

    try {
      await axios.post(`${API}/auth/resend-verification`, {
        email: resendEmail
      });
      
      toast.success('Nuevo enlace de verificación enviado a tu email');
      setResendEmail('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Error al enviar el email';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Verificando Email
              </CardTitle>
              <CardDescription className="text-slate-600">
                Por favor espera mientras verificamos tu cuenta...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                ¡Email Verificado!
              </CardTitle>
              <CardDescription className="text-slate-600">
                Tu cuenta ha sido activada exitosamente
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-slate-700">
                  {message}
                </p>
                <p className="text-sm text-slate-500">
                  Serás redirigido al login automáticamente en unos segundos...
                </p>
                
                <div className="pt-4">
                  <Link to="/login">
                    <Button className="w-full btn-primary" data-testid="go-to-login-button">
                      Ir al Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Enlace Expirado
              </CardTitle>
              <CardDescription className="text-slate-600">
                El enlace de verificación ha expirado
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center space-y-4 mb-6">
                <p className="text-slate-700">
                  El enlace de verificación ha expirado. Los enlaces son válidos por 24 horas únicamente.
                </p>
                <p className="text-sm text-slate-500">
                  Ingresa tu email para recibir un nuevo enlace de verificación.
                </p>
              </div>
              
              <form onSubmit={handleResendVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resend_email" className="text-slate-700 font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="resend_email"
                      type="email"
                      placeholder="tu@email.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      data-testid="resend-email-input"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full btn-primary" 
                  disabled={resendLoading || !resendEmail}
                  data-testid="resend-verification-button"
                >
                  {resendLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </div>
                  ) : (
                    'Enviar Nuevo Enlace'
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Volver al Login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              Error de Verificación
            </CardTitle>
            <CardDescription className="text-slate-600">
              No se pudo verificar tu email
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-slate-700">
                {message}
              </p>
              
              <div className="space-y-2 pt-4">
                <Link to="/register">
                  <Button className="w-full btn-primary" data-testid="register-again-button">
                    Registrarse Nuevamente
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="w-full" data-testid="back-to-login-button">
                    Volver al Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;