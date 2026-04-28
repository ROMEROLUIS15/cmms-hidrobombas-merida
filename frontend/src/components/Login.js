import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Wrench, User, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

import logo from '../assets/logo.jpg';

const Login = ({ onLogin, isRegisterMode = false }) => {
  const [isLogin, setIsLogin] = useState(!isRegisterMode);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'technician',
    confirm_password: '',
    remember_me: false
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Real-time validation states
  const [emailExists, setEmailExists] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await axios.post(`${API}/auth/login`, {
          email: formData.email,
          password: formData.password,
          remember_me: formData.remember_me
        });
        
        // Store token
        onLogin(response.data.user, response.data.token);
        toast.success('¡Bienvenido al sistema CMMS!');
      } else {
        await axios.post(`${API}/auth/register`, {
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirm_password,
          full_name: formData.full_name,
          role: formData.role
        });
        toast.success('¡Registro exitoso! Revisa tu email para verificar tu cuenta antes de iniciar sesión.');
        setIsLogin(true);
        setFormData({ 
          email: formData.email, 
          password: '', 
          full_name: '', 
          role: 'technician', 
          confirm_password: '',
          remember_me: false 
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.detail || 'Error en la autenticación';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email exists (for registration)
  const checkEmailExists = async (email) => {
    if (!validateEmail(email) || isLogin) return;
    
    setCheckingEmail(true);
    try {
      // We'll check during registration attempt since there's no dedicated endpoint
      setEmailExists(false);
    } catch (error) {
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });

    // Real-time validation
    if (name === 'email') {
      setEmailValid(validateEmail(value));
      if (validateEmail(value) && !isLogin) {
        setTimeout(() => checkEmailExists(value), 500); // Debounce
      }
    }
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
      if (formData.confirm_password) {
        setPasswordsMatch(value === formData.confirm_password);
      }
    }
    
    if (name === 'confirm_password') {
      setPasswordsMatch(formData.password === value);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-xl mb-4 p-2">
            <img src={logo} alt="Hidrobombas Mérida" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Hidrobombas Mérida
          </h1>
          <p className="text-slate-600">
            Sistema de Gestión de Mantenimiento
          </p>
        </div>

        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-slate-800">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {isLogin 
                ? 'Accede a tu cuenta para gestionar mantenimientos' 
                : 'Crea una nueva cuenta en el sistema'
              }
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
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-slate-700 font-medium">
                    Nombre Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Ingresa tu nombre completo"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      data-testid="full-name-input"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="correo@empresa.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500 ${
                      formData.email && !emailValid ? 'border-red-300' : ''
                    } ${formData.email && emailValid ? 'border-green-300' : ''}`}
                    required
                    data-testid="email-input"
                  />
                  {/* Email validation indicator */}
                  {formData.email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {checkingEmail ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      ) : emailValid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.email && !emailValid && (
                  <p className="text-xs text-red-500 mt-1">Ingresa un email válido</p>
                )}
                {!isLogin && emailExists && (
                  <p className="text-xs text-red-500 mt-1">Este email ya está registrado</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    data-testid="password-input"
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
                
                {/* Password strength meter for registration */}
                {!isLogin && formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-slate-600">Seguridad:</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength <= 1 ? 'bg-red-400 w-1/5' :
                            passwordStrength === 2 ? 'bg-orange-400 w-2/5' :
                            passwordStrength === 3 ? 'bg-yellow-400 w-3/5' :
                            passwordStrength === 4 ? 'bg-green-400 w-4/5' :
                            'bg-green-500 w-full'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength <= 1 ? 'text-red-500' :
                        passwordStrength === 2 ? 'text-orange-500' :
                        passwordStrength === 3 ? 'text-yellow-500' :
                        passwordStrength >= 4 ? 'text-green-500' : 'text-slate-500'
                      }`}>
                        {passwordStrength <= 1 ? 'Débil' :
                         passwordStrength === 2 ? 'Regular' :
                         passwordStrength === 3 ? 'Buena' :
                         passwordStrength >= 4 ? 'Fuerte' : ''}
                      </span>
                    </div>
                    
                    {/* Password requirements */}
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`flex items-center space-x-1 ${formData.password.length >= 8 ? 'text-green-600' : 'text-slate-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span>8+ caracteres</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span>Mayúscula</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span>Minúscula</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span>Número</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {!isLogin && (
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
                    <div className={`flex items-center space-x-2 text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Las contraseñas coinciden</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Las contraseñas no coinciden</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-700 font-medium">
                    Rol
                  </Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                    data-testid="role-select"
                  >
                    <option value="technician">Técnico</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}
              
              {isLogin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember_me"
                    checked={formData.remember_me}
                    onCheckedChange={(checked) => handleInputChange({ target: { name: 'remember_me', value: checked } })}
                    data-testid="remember-me-checkbox"
                  />
                  <Label htmlFor="remember_me" className="text-sm text-slate-600">
                    Recordar sesión
                  </Label>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full btn-primary text-white font-medium py-2.5 rounded-lg transition-all duration-300"
                disabled={loading}
                data-testid="submit-button"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </div>
                ) : (
                  isLogin ? 'Iniciar Sesión' : 'Registrarse'
                )}
              </Button>
            </form>
            
            {isLogin && (
              <div className="mt-4 text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  data-testid="forgot-password-link"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ 
                    email: '', 
                    password: '', 
                    full_name: '', 
                    role: 'technician', 
                    confirm_password: '',
                    remember_me: false 
                  });
                }}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                data-testid="toggle-mode-button"
              >
                {isLogin 
                  ? '¿No tienes cuenta? Regístrate aquí' 
                  : '¿Ya tienes cuenta? Inicia sesión'
                }
              </button>
            </div>
            

          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-slate-500">
          © 2026 Hidrobombas Mérida. Sistema especializado en mantenimiento.
        </div>
      </div>
    </div>
  );
};

export default Login;