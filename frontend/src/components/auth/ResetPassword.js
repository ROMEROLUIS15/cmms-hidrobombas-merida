import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }
      
      try {
        const response = await axios.get(`${API}/auth/validate-token/${token}`);
        if (response.data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(response.data.message);
        }
      } catch (error) {
        setTokenValid(false);
        setError('Token inválido o expirado');
      }
    };

    validateToken();
  }, [token]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      isValid: minLength && hasUpper && hasLower && hasNumber
    };
  };

  const passwordValidation = validatePassword(formData.new_password);
  const passwordsMatch = formData.new_password === formData.confirm_password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }
    
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/auth/reset-password`, {
        token: token,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });
      
      setSuccess(true);
      toast.success('Contraseña restablecida exitosamente');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al restablecer la contraseña';
      setError(message);
      toast.error(message);
      
      if (error.response?.status === 400) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Enlace Inválido
              </CardTitle>
              <CardDescription className="text-slate-600">
                El enlace de recuperación no es válido o ha expirado
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-slate-700">
                  El enlace de recuperación de contraseña no es válido o ha expirado.
                </p>
                <p className="text-sm text-slate-500">
                  Los enlaces de recuperación son válidos por 1 hora únicamente.
                </p>
                
                <div className="space-y-2 pt-4">
                  <Link to="/forgot-password">
                    <Button className="w-full btn-primary" data-testid="request-new-link-button">
                      Solicitar Nuevo Enlace
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
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                ¡Contraseña Restablecida!
              </CardTitle>
              <CardDescription className="text-slate-600">
                Tu contraseña ha sido actualizada exitosamente
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-slate-700">
                  Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Nueva Contraseña
          </h1>
          <p className="text-slate-600">
            Ingresa tu nueva contraseña segura
          </p>
        </div>

        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-800">
              Restablecer Contraseña
            </CardTitle>
            <CardDescription className="text-slate-600">
              Crea una nueva contraseña segura para tu cuenta
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
                <Label htmlFor="new_password" className="text-slate-700 font-medium">
                  Nueva Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="new_password"
                    name="new_password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.new_password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    data-testid="new-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password requirements */}
                {formData.new_password && (
                  <div className="text-xs space-y-1 mt-2">
                    <div className={`flex items-center space-x-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.minLength ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Mínimo 8 caracteres</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasUpper ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.hasUpper ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Una letra mayúscula</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasLower ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.hasLower ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Una letra minúscula</span>
                    </div>
                    <div className={`flex items-center space-x-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.hasNumber ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Un número</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-slate-700 font-medium">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    data-testid="confirm-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    data-testid="toggle-confirm-password-visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {formData.confirm_password && (
                  <div className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-primary text-white font-medium py-2.5 rounded-lg transition-all duration-300"
                disabled={loading || !passwordValidation.isValid || !passwordsMatch}
                data-testid="reset-password-button"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Restableciendo...
                  </div>
                ) : (
                  'Restablecer Contraseña'
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
};

export default ResetPassword;