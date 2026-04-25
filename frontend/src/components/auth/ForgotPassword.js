import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/forgot-password`, {
        email: email
      });
      
      const data = response.data;
      
      // Solo mostrar "Email Enviado" si realmente se envió un email
      if (data.email_sent) {
        setEmailSent(true);
        toast.success('Se ha enviado un enlace de recuperación a tu email');
      } else {
        // Mostrar mensaje genérico sin confirmar envío
        setError(data.message);
        toast.info(data.message);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al enviar email de recuperación';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Email Enviado
              </CardTitle>
              <CardDescription className="text-slate-600">
                Revisa tu bandeja de entrada
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-slate-700">
                  Se ha enviado un enlace de recuperación de contraseña a <strong>{email}</strong>
                </p>
                <p className="text-sm text-slate-500">
                  El enlace será válido por 1 hora. Si no recibes el email, revisa tu carpeta de spam.
                </p>
                
                <div className="pt-4">
                  <Link to="/login">
                    <Button variant="outline" className="w-full" data-testid="back-to-login-button">
                      <ArrowLeft className="w-4 h-4 mr-2" />
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Login
          </Link>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-slate-600">
            Ingresa tu email para recibir un enlace de recuperación
          </p>
        </div>

        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-800">
              Recuperación de Contraseña
            </CardTitle>
            <CardDescription className="text-slate-600">
              Te enviaremos un enlace para restablecer tu contraseña
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    data-testid="email-input"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-primary text-white font-medium py-2.5 rounded-lg transition-all duration-300"
                disabled={loading || !email}
                data-testid="send-reset-button"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Enlace de Recuperación
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                ¿Recordaste tu contraseña?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;