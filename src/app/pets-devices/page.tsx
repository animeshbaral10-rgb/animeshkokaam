'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, X, User, Edit, Trash2, Upload, Image as ImageIcon, Eye } from 'lucide-react';
import { petsApi, devicesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  ageYears?: number;
  weightKg?: number;
  photoUrl?: string;
  microchipId?: string;
  notes?: string;
  linkedDevice?: string;
  status: 'active' | 'inactive';
}

interface Device {
  id: string;
  deviceId: string;
  simNumber?: string;
  imei?: string;
  model?: string;
  firmwareVersion?: string;
  batteryLevel?: number;
  assignedPet?: string;
  assignedPetId?: string;
  lastContact?: string;
  status: 'active' | 'inactive' | 'maintenance';
  name?: string;
}

export default function PetsDevicesPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [petDialogOpen, setPetDialogOpen] = useState(false);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [viewPetDialogOpen, setViewPetDialogOpen] = useState(false);
  const [viewDeviceDialogOpen, setViewDeviceDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [viewingPet, setViewingPet] = useState<Pet | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [viewingDevice, setViewingDevice] = useState<Device | null>(null);
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    ageYears: '',
    weightKg: '',
    photoUrl: '',
    microchipId: '',
    notes: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [deviceForm, setDeviceForm] = useState({ deviceId: '', name: '', simNumber: '', imei: '', assignedPetId: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [petsData, devicesData] = await Promise.all([
        petsApi.getAll().catch(() => []),
        devicesApi.getAll().catch(() => []),
      ]);

      // Map pets with linked devices
      const petsWithDevices = petsData.map((pet: any) => {
        const linkedDevice = devicesData.find((d: any) =>
          d.petLinks?.some((link: any) => link.petId === pet.id && link.isActive)
        );
        return {
          id: pet.id,
          name: pet.name || 'Unnamed Pet',
          species: pet.species || 'dog',
          breed: pet.breed || '',
          ageYears: pet.ageYears,
          weightKg: pet.weightKg,
          photoUrl: pet.photoUrl,
          microchipId: pet.microchipId,
          notes: pet.notes,
          linkedDevice: linkedDevice ? (linkedDevice.name || linkedDevice.deviceId) : '',
          status: 'active' as const,
        };
      });

      const devicesMapped = devicesData.map((device: any) => {
        const activeLink = device.petLinks?.find((link: any) => link.isActive);
        return {
          id: device.id,
          deviceId: device.deviceId || '',
          simNumber: device.simNumber || '',
          imei: device.imei || '',
          model: device.model || '',
          firmwareVersion: device.firmwareVersion || '',
          batteryLevel: device.batteryLevel,
          assignedPet: activeLink?.pet?.name || '',
          assignedPetId: activeLink?.petId || '',
          lastContact: device.lastContact ? new Date(device.lastContact).toLocaleString() : 'Never',
          status: device.status || 'active',
          name: device.name || '',
        };
      });

      setPets(petsWithDevices);
      setDevices(devicesMapped);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePet = async () => {
    try {
      const petData = {
        name: petForm.name,
        species: petForm.species,
        breed: petForm.breed || undefined,
        ageYears: petForm.ageYears ? parseInt(petForm.ageYears.toString()) : undefined,
        weightKg: petForm.weightKg ? parseFloat(petForm.weightKg.toString()) : undefined,
        photoUrl: petForm.photoUrl || undefined,
        microchipId: petForm.microchipId || undefined,
        notes: petForm.notes || undefined,
      };
      await petsApi.create(petData);
      toast({ title: 'Success', description: 'Pet created successfully' });
      setPetDialogOpen(false);
      setPetForm({
        name: '',
        species: 'dog',
        breed: '',
        ageYears: '',
        weightKg: '',
        photoUrl: '',
        microchipId: '',
        notes: '',
      });
      setPhotoPreview(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create pet',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePet = async () => {
    if (!editingPet) return;
    try {
      const petData = {
        name: petForm.name,
        species: petForm.species,
        breed: petForm.breed || undefined,
        ageYears: petForm.ageYears ? parseInt(petForm.ageYears.toString()) : undefined,
        weightKg: petForm.weightKg ? parseFloat(petForm.weightKg.toString()) : undefined,
        photoUrl: petForm.photoUrl || undefined,
        microchipId: petForm.microchipId || undefined,
        notes: petForm.notes || undefined,
      };
      await petsApi.update(editingPet.id, petData);
      toast({ title: 'Success', description: 'Pet updated successfully' });
      setPetDialogOpen(false);
      setEditingPet(null);
      setPetForm({
        name: '',
        species: 'dog',
        breed: '',
        ageYears: '',
        weightKg: '',
        photoUrl: '',
        microchipId: '',
        notes: '',
      });
      setPhotoPreview(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update pet',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pet?')) return;
    try {
      await petsApi.delete(id);
      toast({ title: 'Success', description: 'Pet deleted successfully' });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete pet',
        variant: 'destructive',
      });
    }
  };

  const handleCreateDevice = async () => {
    try {
      const { assignedPetId, ...deviceData } = deviceForm;
      const createdDevice = await devicesApi.create(deviceData);
      
      // Link to pet if selected
      if (assignedPetId && createdDevice.id) {
        try {
          await devicesApi.linkToPet(createdDevice.id, assignedPetId);
        } catch (linkError: any) {
          console.error('Failed to link pet:', linkError);
          toast({
            title: 'Warning',
            description: 'Device created but failed to link pet. You can link it manually.',
            variant: 'destructive',
          });
        }
      }
      
      toast({ title: 'Success', description: 'Device registered successfully' });
      setDeviceDialogOpen(false);
      setDeviceForm({ deviceId: '', name: '', simNumber: '', imei: '', assignedPetId: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register device',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;
    try {
      const { assignedPetId, ...deviceData } = deviceForm;
      await devicesApi.update(editingDevice.id, deviceData);
      
      // Handle pet linking/unlinking
      const currentPetId = editingDevice.assignedPetId;
      if (assignedPetId !== currentPetId) {
        if (assignedPetId) {
          // Link to new pet
          try {
            await devicesApi.linkToPet(editingDevice.id, assignedPetId);
            toast({ title: 'Success', description: 'Device updated and pet linked successfully' });
          } catch (linkError: any) {
            console.error('Failed to link pet:', linkError);
            toast({
              title: 'Warning',
              description: 'Device updated but failed to link pet',
              variant: 'destructive',
            });
          }
        } else if (currentPetId) {
          // Unlink pet (we need to handle this - for now just show a message)
          toast({ 
            title: 'Info', 
            description: 'Device updated. To unlink pet, please use the unlink feature.' 
          });
        }
      } else {
        toast({ title: 'Success', description: 'Device updated successfully' });
      }
      
      setDeviceDialogOpen(false);
      setEditingDevice(null);
      setDeviceForm({ deviceId: '', name: '', simNumber: '', imei: '', assignedPetId: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update device',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await devicesApi.delete(id);
      toast({ title: 'Success', description: 'Device deleted successfully' });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete device',
        variant: 'destructive',
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPetForm({ ...petForm, photoUrl: base64String });
        setPhotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPetForm({ ...petForm, photoUrl: '' });
    setPhotoPreview(null);
    // Reset file input
    const fileInput = document.getElementById('pet-photo-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const openViewPetDialog = (pet: Pet) => {
    setViewingPet(pet);
    setViewPetDialogOpen(true);
  };

  const openViewDeviceDialog = (device: Device) => {
    setViewingDevice(device);
    setViewDeviceDialogOpen(true);
  };

  const openPetDialog = (pet?: Pet) => {
    if (pet) {
      setEditingPet(pet);
      setPetForm({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        ageYears: pet.ageYears?.toString() || '',
        weightKg: pet.weightKg?.toString() || '',
        photoUrl: pet.photoUrl || '',
        microchipId: pet.microchipId || '',
        notes: pet.notes || '',
      });
      setPhotoPreview(pet.photoUrl || null);
    } else {
      setEditingPet(null);
      setPetForm({
        name: '',
        species: 'dog',
        breed: '',
        ageYears: '',
        weightKg: '',
        photoUrl: '',
        microchipId: '',
        notes: '',
      });
      setPhotoPreview(null);
    }
    setPetDialogOpen(true);
  };

  const openDeviceDialog = (device?: Device) => {
    if (device) {
      setEditingDevice(device);
      setDeviceForm({
        deviceId: device.deviceId,
        name: device.name || '',
        simNumber: device.simNumber || '',
        imei: '',
        assignedPetId: device.assignedPetId || '',
      });
    } else {
      setEditingDevice(null);
      setDeviceForm({ deviceId: '', name: '', simNumber: '', imei: '', assignedPetId: '' });
    }
    setDeviceDialogOpen(true);
  };

  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDevices = devices.filter((device) =>
    device.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.simNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Pets & Devices</h1>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pets or devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => openPetDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pet
            </Button>
            <Button variant="outline" onClick={() => openDeviceDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Register Device
            </Button>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Pets Table */}
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-medium text-foreground">Pets</h3>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Species</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Microchip</TableHead>
                    <TableHead>Linked Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No pets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPets.map((pet) => (
                      <TableRow key={pet.id}>
                        <TableCell>
                          {pet.photoUrl ? (
                            <img
                              src={pet.photoUrl}
                              alt={pet.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${pet.photoUrl ? 'hidden' : ''}`}
                            style={{ display: pet.photoUrl ? 'none' : 'flex' }}
                          >
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{pet.name}</TableCell>
                        <TableCell className="capitalize">{pet.species}</TableCell>
                        <TableCell>{pet.breed || '—'}</TableCell>
                        <TableCell>{pet.ageYears ? `${pet.ageYears} yrs` : '—'}</TableCell>
                        <TableCell>{pet.weightKg ? `${pet.weightKg} kg` : '—'}</TableCell>
                        <TableCell className="text-xs">{pet.microchipId || '—'}</TableCell>
                        <TableCell>{pet.linkedDevice || '—'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            pet.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pet.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openViewPetDialog(pet)} title="View">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openPetDialog(pet)} title="Edit">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeletePet(pet.id)} title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>

            {/* Devices Table */}
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-medium text-foreground">Devices</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SIM Number</TableHead>
                    <TableHead>Assigned Pet</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No devices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDevices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>{device.deviceId}</TableCell>
                        <TableCell>{device.name || '—'}</TableCell>
                        <TableCell>{device.simNumber || '—'}</TableCell>
                        <TableCell>{device.assignedPet || '—'}</TableCell>
                        <TableCell>{device.lastContact}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            device.status === 'active' ? 'bg-green-100 text-green-800' :
                            device.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {device.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openViewDeviceDialog(device)} title="View">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openDeviceDialog(device)} title="Edit">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteDevice(device.id)} title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Pet Dialog */}
        <Dialog
          open={petDialogOpen}
          onOpenChange={(open) => {
            setPetDialogOpen(open);
            if (!open) {
              setPhotoPreview(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingPet ? 'Edit Pet' : 'Add New Pet'}</DialogTitle>
              <DialogDescription>
                {editingPet ? 'Update pet information' : 'Enter pet details below'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pet-name">Name *</Label>
                  <Input
                    id="pet-name"
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    placeholder="Pet name"
                  />
                </div>
                <div>
                  <Label htmlFor="pet-species">Species *</Label>
                  <Select value={petForm.species} onValueChange={(value) => setPetForm({ ...petForm, species: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pet-breed">Breed (optional)</Label>
                  <Input
                    id="pet-breed"
                    value={petForm.breed}
                    onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                    placeholder="Breed"
                  />
                </div>
                <div>
                  <Label htmlFor="pet-age">Age (years, optional)</Label>
                  <Input
                    id="pet-age"
                    type="number"
                    min="0"
                    max="30"
                    value={petForm.ageYears}
                    onChange={(e) => setPetForm({ ...petForm, ageYears: e.target.value })}
                    placeholder="Age in years"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pet-weight">Weight (kg, optional)</Label>
                  <Input
                    id="pet-weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={petForm.weightKg}
                    onChange={(e) => setPetForm({ ...petForm, weightKg: e.target.value })}
                    placeholder="Weight in kg"
                  />
                </div>
                <div>
                  <Label htmlFor="pet-microchip">Microchip ID (optional)</Label>
                  <Input
                    id="pet-microchip"
                    value={petForm.microchipId}
                    onChange={(e) => setPetForm({ ...petForm, microchipId: e.target.value })}
                    placeholder="Microchip ID"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pet-photo">Pet Photo (optional)</Label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {photoPreview && (
                    <div className="relative w-32 h-32 border border-border rounded-lg overflow-hidden">
                      <img
                        src={photoPreview}
                        alt="Pet preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* File Input */}
                  <div className="flex gap-2">
                    <Input
                      id="pet-photo-file"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('pet-photo-file')?.click()}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {photoPreview ? 'Change Photo' : 'Select Image'}
                    </Button>
                  </div>
                  
                  {/* URL Input (alternative) */}
                  <div>
                    <Label htmlFor="pet-photo-url" className="text-xs text-muted-foreground">
                      Or enter photo URL:
                    </Label>
                    <Input
                      id="pet-photo-url"
                      type="url"
                      value={petForm.photoUrl && !petForm.photoUrl.startsWith('data:') ? petForm.photoUrl : ''}
                      onChange={(e) => {
                        setPetForm({ ...petForm, photoUrl: e.target.value });
                        if (e.target.value) {
                          setPhotoPreview(e.target.value);
                        } else {
                          setPhotoPreview(null);
                        }
                      }}
                      placeholder="https://example.com/photo.jpg"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="pet-notes">Notes (optional)</Label>
                <textarea
                  id="pet-notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={petForm.notes}
                  onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
                  placeholder="Additional notes about your pet..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPetDialogOpen(false)}>Cancel</Button>
              <Button onClick={editingPet ? handleUpdatePet : handleCreatePet}>
                {editingPet ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Pet Dialog */}
        <Dialog open={viewPetDialogOpen} onOpenChange={setViewPetDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Pet Details</DialogTitle>
              <DialogDescription>
                View complete information about {viewingPet?.name}
              </DialogDescription>
            </DialogHeader>
            {viewingPet && (
              <div className="space-y-6 py-4 max-h-[600px] overflow-y-auto">
                {/* Photo Section */}
                {viewingPet.photoUrl && (
                  <div className="flex justify-center">
                    <div className="relative w-48 h-48 border border-border rounded-lg overflow-hidden">
                      <img
                        src={viewingPet.photoUrl}
                        alt={viewingPet.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="text-base font-medium mt-1">{viewingPet.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Species</Label>
                    <p className="text-base font-medium mt-1 capitalize">{viewingPet.species}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Breed</Label>
                    <p className="text-base font-medium mt-1">{viewingPet.breed || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Age</Label>
                    <p className="text-base font-medium mt-1">
                      {viewingPet.ageYears ? `${viewingPet.ageYears} years` : '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Weight</Label>
                    <p className="text-base font-medium mt-1">
                      {viewingPet.weightKg ? `${viewingPet.weightKg} kg` : '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Microchip ID</Label>
                    <p className="text-base font-medium mt-1">{viewingPet.microchipId || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Linked Device</Label>
                    <p className="text-base font-medium mt-1">{viewingPet.linkedDevice || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        viewingPet.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingPet.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Notes Section */}
                {viewingPet.notes && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Notes</Label>
                    <p className="text-base mt-1 whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                      {viewingPet.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewPetDialogOpen(false)}>Close</Button>
              {viewingPet && (
                <Button onClick={() => {
                  setViewPetDialogOpen(false);
                  openPetDialog(viewingPet);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Pet
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Device Dialog */}
        <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDevice ? 'Edit Device' : 'Register New Device'}</DialogTitle>
              <DialogDescription>
                {editingDevice ? 'Update device information' : 'Enter device details below'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="device-id">Device ID *</Label>
                <Input
                  id="device-id"
                  value={deviceForm.deviceId}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceId: e.target.value })}
                  placeholder="Device ID"
                  disabled={!!editingDevice}
                />
              </div>
              <div>
                <Label htmlFor="device-name">Name (optional)</Label>
                <div className="space-y-2">
                  <Input
                    id="device-name"
                    value={deviceForm.name}
                    onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                    placeholder="Enter device name or select from pets below"
                    className="w-full"
                  />
                  {pets.length > 0 && !editingDevice && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Quick select: {pets.length} {pets.length === 1 ? 'pet' : 'pets'} available
                      </p>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const selectedPet = pets.find((p) => p.id === value);
                          if (selectedPet) {
                            setDeviceForm({ ...deviceForm, name: selectedPet.name });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a pet name to use" />
                        </SelectTrigger>
                        <SelectContent>
                          {pets.map((pet) => (
                            <SelectItem key={pet.id} value={pet.id}>
                              {pet.name} {pet.species && `(${pet.species})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="sim-number">SIM Number (optional)</Label>
                <Input
                  id="sim-number"
                  value={deviceForm.simNumber}
                  onChange={(e) => setDeviceForm({ ...deviceForm, simNumber: e.target.value })}
                  placeholder="SIM number"
                />
              </div>
              <div>
                <Label htmlFor="imei">IMEI (optional)</Label>
                <Input
                  id="imei"
                  value={deviceForm.imei}
                  onChange={(e) => setDeviceForm({ ...deviceForm, imei: e.target.value })}
                  placeholder="IMEI"
                />
              </div>
              <div>
                <Label htmlFor="assigned-pet">Assign Pet (optional)</Label>
                <Select
                  value={deviceForm.assignedPetId || 'none'}
                  onValueChange={(value) => setDeviceForm({ ...deviceForm, assignedPetId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pet to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Unassign)</SelectItem>
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name} {pet.species && `(${pet.species})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deviceForm.assignedPetId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected pet will be linked to this device
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeviceDialogOpen(false)}>Cancel</Button>
              <Button onClick={editingDevice ? handleUpdateDevice : handleCreateDevice}>
                {editingDevice ? 'Update' : 'Register'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Device Dialog */}
        <Dialog open={viewDeviceDialogOpen} onOpenChange={setViewDeviceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Device Details</DialogTitle>
              <DialogDescription>
                View complete information about {viewingDevice?.name || viewingDevice?.deviceId}
              </DialogDescription>
            </DialogHeader>
            {viewingDevice && (
              <div className="space-y-6 py-4 max-h-[600px] overflow-y-auto">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Device ID</Label>
                    <p className="text-base font-medium mt-1">{viewingDevice.deviceId}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="text-base font-medium mt-1">{viewingDevice.name || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">SIM Number</Label>
                    <p className="text-base font-medium mt-1">{viewingDevice.simNumber || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">IMEI</Label>
                    <p className="text-base font-medium mt-1">{viewingDevice.imei || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Model</Label>
                    <p className="text-base font-medium mt-1">{viewingDevice.model || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Firmware Version</Label>
                    <p className="text-base font-medium mt-1">{viewingDevice.firmwareVersion || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Battery Level</Label>
                    <p className="text-base font-medium mt-1">
                      {viewingDevice.batteryLevel !== undefined ? `${viewingDevice.batteryLevel}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Assigned Pet</Label>
                    <p className="text-base font-medium mt-1">{viewingDevice.assignedPet || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Contact</Label>
                    <p className="text-base font-medium mt-1">{viewingDevice.lastContact || 'Never'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        viewingDevice.status === 'active' ? 'bg-green-100 text-green-800' :
                        viewingDevice.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {viewingDevice.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDeviceDialogOpen(false)}>Close</Button>
              {viewingDevice && (
                <Button onClick={() => {
                  setViewDeviceDialogOpen(false);
                  openDeviceDialog(viewingDevice);
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Device
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  );
}

