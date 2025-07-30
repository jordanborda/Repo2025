'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Eye,
  Download,
  Filter,
  Search,
  FileText,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  FileBadge,
  BookOpen,
  Info,
  RotateCcw,
  Lock,
  LogIn,
  LogOut,
  Shield,
  Mail,
  Phone,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Types
interface SupportTicket {
  id?: string;
  nombre: string;
  apellidos: string;
  correoElectronico: string;
  numeroCelular: string;
  codigoEstudiante: string;
  asunto: string;
  tipoSoporte: 'borrador_tesis' | 'sustentacion' | 'otro';
  estado: 'pendiente' | 'en_proceso' | 'resuelto';
  fechaCreacion: Date;
  actaAprobacion?: string;
  archivoPerfil?: string;
  borradorSinCorrecciones?: string;
  borradorCorregido?: string;
  capturaEmail?: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [tipoSoporteFilter, setTipoSoporteFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [tickets, estadoFilter, tipoSoporteFilter, searchText]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    setTimeout(() => {
      if (loginForm.username === 'admin' && loginForm.password === 'repo2025') {
        setIsAuthenticated(true);
        toast.success('¡Bienvenido!', {
          description: 'Acceso al panel de administración concedido.',
        });
      } else {
        toast.error('Error de autenticación', {
          description: 'Credenciales incorrectas. Intente nuevamente.',
        });
      }
      setLoginLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setTickets([]);
    setFilteredTickets([]);
    setLoginForm({ username: '', password: '' });
    toast.info('Sesión cerrada', {
      description: 'Ha cerrado sesión correctamente.',
    });
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const ticketsCollection = collection(db, 'tickets_soporte');
      const ticketsQuery = query(ticketsCollection, orderBy('fechaCreacion', 'desc'));
      const querySnapshot = await getDocs(ticketsQuery);
      
      const ticketsData: SupportTicket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ticketsData.push({
          id: doc.id,
          nombre: data.nombre || '',
          apellidos: data.apellidos || '',
          correoElectronico: data.correoElectronico || '',
          numeroCelular: data.numeroCelular || '',
          codigoEstudiante: data.codigoEstudiante || '',
          asunto: data.asunto || '',
          tipoSoporte: (data.tipoSoporte as 'borrador_tesis' | 'sustentacion' | 'otro') || 'otro',
          estado: (data.estado as 'pendiente' | 'en_proceso' | 'resuelto') || 'pendiente',
          fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
          actaAprobacion: data.actaAprobacion,
          archivoPerfil: data.archivoPerfil,
          borradorSinCorrecciones: data.borradorSinCorrecciones,
          borradorCorregido: data.borradorCorregido,
          capturaEmail: data.capturaEmail,
        });
      });
      
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error al obtener tickets:', error);
      toast.error('Error', {
        description: 'No se pudieron cargar los tickets.',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (estadoFilter) {
      filtered = filtered.filter(ticket => ticket.estado === estadoFilter);
    }

    if (tipoSoporteFilter) {
      filtered = filtered.filter(ticket => ticket.tipoSoporte === tipoSoporteFilter);
    }

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.nombre?.toLowerCase().includes(search) ||
        ticket.apellidos?.toLowerCase().includes(search) ||
        ticket.correoElectronico?.toLowerCase().includes(search) ||
        ticket.codigoEstudiante?.toLowerCase().includes(search) ||
        ticket.asunto?.toLowerCase().includes(search)
      );
    }

    setFilteredTickets(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const updateTicketStatus = async (ticketId: string, newStatus: 'pendiente' | 'en_proceso' | 'resuelto') => {
    try {
      const ticketRef = doc(db, 'tickets_soporte', ticketId);
      await updateDoc(ticketRef, { estado: newStatus });
      
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, estado: newStatus } : ticket
      ));
      
      toast.success('Estado actualizado', {
        description: 'El estado del ticket se ha actualizado correctamente.',
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error', {
        description: 'No se pudo actualizar el estado del ticket.',
      });
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': 
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>;
      case 'en_proceso': 
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          En Proceso
        </Badge>;
      case 'resuelto': 
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resuelto
        </Badge>;
      default: 
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getTipoSoporteBadge = (tipo: string) => {
    switch (tipo) {
      case 'borrador_tesis': 
        return <Badge variant="outline" className="border-blue-300 text-blue-800">
          <BookOpen className="w-3 h-3 mr-1" />
          Borrador de Tesis
        </Badge>;
      case 'sustentacion': 
        return <Badge variant="outline" className="border-green-300 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sustentación
        </Badge>;
      case 'otro': 
        return <Badge variant="outline" className="border-gray-300 text-gray-800">
          <Info className="w-3 h-3 mr-1" />
          Consulta General
        </Badge>;
      default: 
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const getStatistics = () => {
    const total = tickets.length;
    const pendientes = tickets.filter(t => t.estado === 'pendiente').length;
    const enProceso = tickets.filter(t => t.estado === 'en_proceso').length;
    const resueltos = tickets.filter(t => t.estado === 'resuelto').length;
    return { total, pendientes, enProceso, resueltos };
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setEstadoFilter('');
    setTipoSoporteFilter('');
    setSearchText('');
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Panel Administrativo
            </CardTitle>
            <CardDescription>
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
            <p className="text-slate-600 mt-1">Gestión de tickets de soporte académico</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTickets}
              disabled={loading}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Sheet open={filterSheetVisible} onOpenChange={setFilterSheetVisible}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>
                    Filtre los tickets por estado, tipo y otros criterios
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los estados</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                        <SelectItem value="resuelto">Resuelto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Soporte</Label>
                    <Select value={tipoSoporteFilter} onValueChange={setTipoSoporteFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los tipos</SelectItem>
                        <SelectItem value="borrador_tesis">Borrador de Tesis</SelectItem>
                        <SelectItem value="sustentacion">Sustentación</SelectItem>
                        <SelectItem value="otro">Consulta General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendientes}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">En Proceso</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.enProceso}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Resueltos</p>
                  <p className="text-3xl font-bold text-green-600">{stats.resueltos}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, email, código..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2" />
                          Cargando tickets...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No se encontraron tickets
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-xs">
                          {ticket.id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.nombre} {ticket.apellidos}</p>
                            <p className="text-sm text-slate-500">{ticket.codigoEstudiante}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTipoSoporteBadge(ticket.tipoSoporte)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.estado}
                            onValueChange={(value: 'pendiente' | 'en_proceso' | 'resuelto') => 
                              updateTicketStatus(ticket.id!, value)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="en_proceso">En Proceso</SelectItem>
                              <SelectItem value="resuelto">Resuelto</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(ticket.fechaCreacion, 'dd/MM/yyyy', { locale: es })}</div>
                            <div className="text-slate-500">{format(ticket.fechaCreacion, 'HH:mm')}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setDetailModalVisible(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTickets.length)} de {filteredTickets.length} tickets
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Modal */}
        <Dialog open={detailModalVisible} onOpenChange={setDetailModalVisible}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-blue-900">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 ">
                <FileText className="w-5 h-5 text-blue-900" />
                Detalles del Ticket
              </DialogTitle>
              <DialogDescription>
                Información completa del ticket de soporte
              </DialogDescription>
            </DialogHeader>
            
            {selectedTicket && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Información Personal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Nombre:</span>
                        <span className="font-medium">{selectedTicket.nombre} {selectedTicket.apellidos}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Email:</span>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-xs">{selectedTicket.correoElectronico}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Teléfono:</span>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{selectedTicket.numeroCelular}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Código:</span>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span className="font-medium">{selectedTicket.codigoEstudiante}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Información del Ticket
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">ID:</span>
                        <span className="font-mono text-xs">{selectedTicket.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tipo:</span>
                        {getTipoSoporteBadge(selectedTicket.tipoSoporte)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Estado:</span>
                        {getStatusBadge(selectedTicket.estado)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Fecha:</span>
                        <span className="font-medium">
                          {format(selectedTicket.fechaCreacion, 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Descripción del Problema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedTicket.asunto}
                    </p>
                  </CardContent>
                </Card>

                {/* Attached Files */}
                {(selectedTicket.actaAprobacion || selectedTicket.archivoPerfil || 
                  selectedTicket.borradorSinCorrecciones || selectedTicket.borradorCorregido || 
                  selectedTicket.capturaEmail) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Archivos Adjuntos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedTicket.actaAprobacion && (
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                              <FileBadge className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">Acta de Aprobación</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => downloadFile(selectedTicket.actaAprobacion!, 'acta_aprobacion.pdf')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {selectedTicket.archivoPerfil && (
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">Archivo de Perfil</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => downloadFile(selectedTicket.archivoPerfil!, 'archivo_perfil.pdf')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {selectedTicket.borradorSinCorrecciones && (
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">Borrador Original</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => downloadFile(selectedTicket.borradorSinCorrecciones!, 'borrador_original.pdf')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {selectedTicket.borradorCorregido && (
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium">Borrador Corregido</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => downloadFile(selectedTicket.borradorCorregido!, 'borrador_corregido.pdf')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        {selectedTicket.capturaEmail && (
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">Captura Email</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => downloadFile(selectedTicket.capturaEmail!, 'captura_email.pdf')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}