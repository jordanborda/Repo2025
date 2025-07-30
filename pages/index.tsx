'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import SuccessAnimation from '@/components/SuccessAnimation';
import { db, storage } from '../lib/firebase';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Upload, 
  Send,
  BookOpen,
  CheckCircle,
  Info,
  FileText,
  AlertCircle
} from 'lucide-react';

// Types and Interfaces
interface FormData {
  nombre: string;
  apellidos: string;
  correoElectronico: string;
  numeroCelular: string;
  codigoEstudiante: string;
  asunto: string;
  tipoSoporte: 'borrador_tesis' | 'sustentacion' | 'otro';
}

interface FileData {
  actaAprobacion: File | null;
  archivoPerfil: File | null;
  borradorSinCorrecciones: File | null;
  borradorCorregido: File | null;
  capturaEmail: File | null;
}

interface FormErrors {
  nombre?: string;
  apellidos?: string;
  correoElectronico?: string;
  numeroCelular?: string;
  codigoEstudiante?: string;
  asunto?: string;
  documentos?: string;
}

interface SupportTicket extends FormData {
  fechaCreacion: Date;
  estado: string;
  actaAprobacion?: string;
  archivoPerfil?: string;
  borradorSinCorrecciones?: string;
  borradorCorregido?: string;
  capturaEmail?: string;
}

type TipoSoporte = FormData['tipoSoporte'];

export default function ModernSupportForm() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellidos: '',
    correoElectronico: '',
    numeroCelular: '',
    codigoEstudiante: '',
    asunto: '',
    tipoSoporte: 'otro'
  });
  
  const [files, setFiles] = useState<FileData>({
    actaAprobacion: null,
    archivoPerfil: null,
    borradorSinCorrecciones: null,
    borradorCorregido: null,
    capturaEmail: null
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>('');

  const handleInputChange = (field: keyof FormData, value: string | TipoSoporte): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (submitError) setSubmitError('');
  };

  const handleFileChange = (field: keyof FileData, file: File | null): void => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const resetForm = (): void => {
    setFormData({
      nombre: '',
      apellidos: '',
      correoElectronico: '',
      numeroCelular: '',
      codigoEstudiante: '',
      asunto: '',
      tipoSoporte: 'otro'
    });
    setFiles({
      actaAprobacion: null,
      archivoPerfil: null,
      borradorSinCorrecciones: null,
      borradorCorregido: null,
      capturaEmail: null
    });
    setErrors({});
    setSubmitError('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre es requerido';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Apellidos son requeridos';
    if (!formData.correoElectronico.trim()) newErrors.correoElectronico = 'Correo es requerido';
    if (!formData.numeroCelular.trim()) newErrors.numeroCelular = 'Celular es requerido';
    if (!formData.codigoEstudiante.trim()) newErrors.codigoEstudiante = 'Código es requerido';
    if (!formData.asunto.trim()) newErrors.asunto = 'Descripción es requerida';
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.correoElectronico && !emailPattern.test(formData.correoElectronico)) {
      newErrors.correoElectronico = 'Correo inválido';
    }

    // Validar archivos requeridos según el tipo de soporte
    if (formData.tipoSoporte === 'borrador_tesis') {
      const hasActa = files.actaAprobacion;
      const hasPerfil = files.archivoPerfil;
      
      if (!hasActa && !hasPerfil) {
        newErrors.documentos = 'Para Borrador de Tesis debe subir al menos uno de los documentos requeridos';
      }
    } else if (formData.tipoSoporte === 'sustentacion') {
      const hasBorradorSin = files.borradorSinCorrecciones;
      const hasBorradorCorregido = files.borradorCorregido;
      const hasCaptura = files.capturaEmail;
      
      if (!hasBorradorSin && !hasBorradorCorregido && !hasCaptura) {
        newErrors.documentos = 'Para Proceso de Sustentación debe subir al menos uno de los documentos requeridos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, `soporte/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Error al subir el archivo');
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return;
    
    setLoading(true);
    setSubmitError('');
    
    try {
      const ticketData: SupportTicket = {
        ...formData,
        fechaCreacion: new Date(),
        estado: 'pendiente'
      };

      // Upload files based on support type
      if (formData.tipoSoporte === 'borrador_tesis') {
        if (files.actaAprobacion) {
          const actaUrl = await uploadFile(files.actaAprobacion, 'acta_aprobacion');
          ticketData.actaAprobacion = actaUrl;
        }
        if (files.archivoPerfil) {
          const perfilUrl = await uploadFile(files.archivoPerfil, 'archivo_perfil');
          ticketData.archivoPerfil = perfilUrl;
        }
      } else if (formData.tipoSoporte === 'sustentacion') {
        if (files.borradorSinCorrecciones) {
          const borradorSinUrl = await uploadFile(files.borradorSinCorrecciones, 'borrador_sin_correcciones');
          ticketData.borradorSinCorrecciones = borradorSinUrl;
        }
        if (files.borradorCorregido) {
          const borradorCorregidoUrl = await uploadFile(files.borradorCorregido, 'borrador_corregido');
          ticketData.borradorCorregido = borradorCorregidoUrl;
        }
        if (files.capturaEmail) {
          const capturaUrl = await uploadFile(files.capturaEmail, 'captura_email');
          ticketData.capturaEmail = capturaUrl;
        }
      }

      // Save to Firestore
      await addDoc(collection(db, 'tickets_soporte'), ticketData);
      
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error al enviar ticket:', error);
      setSubmitError('Error al enviar la solicitud. Por favor, inténtelo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const onSuccessClose = (): void => {
    setShowSuccess(false);
  };

  const onNewTicket = (): void => {
    setShowSuccess(false);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const FileUpload: React.FC<{ 
    field: keyof FileData; 
    label: string; 
    accept?: string 
  }> = ({ field, label, accept = ".pdf" }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(field, e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex items-center justify-center h-8 sm:h-10 px-2 sm:px-3 border border-dashed border-slate-300 rounded-md hover:border-slate-400 transition-colors bg-slate-50 hover:bg-slate-100">
          <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="text-xs text-slate-600 truncate">
            {files[field] ? files[field]!.name : 'Seleccionar archivo'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Success Animation Overlay */}
      <SuccessAnimation 
        visible={showSuccess}
        onClose={onSuccessClose}
        onNewTicket={onNewTicket}
      />

      {/* Main Form */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-0 mx-1 sm:mx-0">
            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    Solicitud de Soporte Académico
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-slate-600 mt-1">
                    Complete la información para recibir asistencia especializada
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Información Personal */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <h3 className="font-semibold text-sm text-slate-900">Información Personal</h3>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">Requerido</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="nombre" className="text-xs font-medium text-slate-700">
                        Nombre *
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('nombre', e.target.value)}
                        placeholder="Ingrese su nombre"
                        className={`h-8 sm:h-9 text-sm ${errors.nombre ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                      {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="apellidos" className="text-xs font-medium text-slate-700">
                        Apellidos *
                      </Label>
                      <Input
                        id="apellidos"
                        value={formData.apellidos}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('apellidos', e.target.value)}
                        placeholder="Ingrese sus apellidos"
                        className={`h-8 sm:h-9 text-sm ${errors.apellidos ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                      {errors.apellidos && <p className="text-xs text-red-500">{errors.apellidos}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <Label htmlFor="correo" className="text-xs font-medium text-slate-700">
                        Correo Electrónico *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2 sm:top-2.5 h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400" />
                        <Input
                          id="correo"
                          type="email"
                          value={formData.correoElectronico}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('correoElectronico', e.target.value)}
                          placeholder="ejemplo@universidad.edu"
                          className={`h-8 sm:h-9 pl-8 sm:pl-9 text-sm ${errors.correoElectronico ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                      </div>
                      {errors.correoElectronico && <p className="text-xs text-red-500">{errors.correoElectronico}</p>}
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="celular" className="text-xs font-medium text-slate-700">
                        Celular *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2 sm:top-2.5 h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400" />
                        <Input
                          id="celular"
                          value={formData.numeroCelular}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('numeroCelular', e.target.value)}
                          placeholder="+51 999 999 999"
                          className={`h-8 sm:h-9 pl-8 sm:pl-9 text-sm ${errors.numeroCelular ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                      </div>
                      {errors.numeroCelular && <p className="text-xs text-red-500">{errors.numeroCelular}</p>}
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="codigo" className="text-xs font-medium text-slate-700">
                        Código Estudiante *
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-2.5 top-2 sm:top-2.5 h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400" />
                        <Input
                          id="codigo"
                          value={formData.codigoEstudiante}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('codigoEstudiante', e.target.value)}
                          placeholder="2021001234"
                          className={`h-8 sm:h-9 pl-8 sm:pl-9 text-sm ${errors.codigoEstudiante ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                      </div>
                      {errors.codigoEstudiante && <p className="text-xs text-red-500">{errors.codigoEstudiante}</p>}
                    </div>
                  </div>
                </div>

                <Separator className="my-3 sm:my-4" />

                {/* Detalles de la Consulta */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <h3 className="font-semibold text-sm text-slate-900">Detalles de la Consulta</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="lg:col-span-2 space-y-1.5">
                      <Label htmlFor="asunto" className="text-xs font-medium text-slate-700">
                        Descripción del Problema *
                      </Label>
                      <Textarea
                        id="asunto"
                        value={formData.asunto}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('asunto', e.target.value)}
                        placeholder="Describa detalladamente su consulta o problema académico..."
                        className={`min-h-[70px] sm:min-h-[80px] text-sm resize-none ${errors.asunto ? 'border-red-300 focus:border-red-500' : ''}`}
                      />
                      {errors.asunto && <p className="text-xs text-red-500">{errors.asunto}</p>}
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">
                        Categoría
                      </Label>
                      <Select 
                        value={formData.tipoSoporte} 
                        onValueChange={(value: TipoSoporte) => handleInputChange('tipoSoporte', value)}
                      >
                        <SelectTrigger className="h-8 sm:h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="borrador_tesis">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="text-sm">Borrador de Tesis</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="sustentacion">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="text-sm">Proceso de Sustentación</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="otro">
                            <div className="flex items-center gap-2">
                              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="text-sm">Consulta General</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Documentos según categoría */}
                {formData.tipoSoporte === 'borrador_tesis' && (
                  <>
                    <Separator className="my-3 sm:my-4" />
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                        <h3 className="font-semibold text-sm text-slate-900">Documentos de Borrador</h3>
                        <Badge variant="destructive" className="text-xs px-1.5 py-0.5">Requerido</Badge>
                      </div>
                      
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                        <AlertDescription className="text-xs text-blue-800">
                          Debe adjuntar al menos uno de estos documentos para procesar su solicitud.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                        <FileUpload 
                          field="actaAprobacion" 
                          label="Acta de Aprobación" 
                        />
                        <FileUpload 
                          field="archivoPerfil" 
                          label="Archivo de Perfil" 
                        />
                      </div>
                      
                      {errors.documentos && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <AlertDescription className="text-xs">
                            {errors.documentos}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}

                {formData.tipoSoporte === 'sustentacion' && (
                  <>
                    <Separator className="my-3 sm:my-4" />
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                        <h3 className="font-semibold text-sm text-slate-900">Documentos de Sustentación</h3>
                        <Badge variant="destructive" className="text-xs px-1.5 py-0.5">Requerido</Badge>
                      </div>
                      
                      <Alert className="border-green-200 bg-green-50">
                        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                        <AlertDescription className="text-xs text-green-800">
                          Debe subir al menos uno de estos documentos para evaluar su proceso de sustentación.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                        <FileUpload 
                          field="borradorSinCorrecciones" 
                          label="Borrador Original" 
                        />
                        <FileUpload 
                          field="borradorCorregido" 
                          label="Borrador Revisado" 
                        />
                        <FileUpload 
                          field="capturaEmail" 
                          label="Confirmación Email" 
                        />
                      </div>
                      
                      {errors.documentos && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <AlertDescription className="text-xs">
                            {errors.documentos}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}

                <Separator className="my-3 sm:my-4" />

                {/* Error de envío */}
                {submitError && (
                  <Alert variant="destructive" className="mb-3 sm:mb-4">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <AlertDescription className="text-xs sm:text-sm">
                      {submitError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Botón de envío */}
                <div className="flex justify-center pt-1 sm:pt-2">
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full sm:w-auto sm:min-w-[200px] lg:min-w-[250px] px-6 sm:px-8 h-9 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm sm:text-base font-medium"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="hidden sm:inline">Procesando...</span>
                        <span className="sm:hidden">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                        <span className="hidden sm:inline">Enviar Solicitud</span>
                        <span className="sm:hidden">Enviar</span>
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-slate-500 leading-relaxed px-2 sm:px-0">
                  Al enviar este formulario, acepta que nuestro equipo se pondrá en contacto para brindar asistencia.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}