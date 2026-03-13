'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stepper, Card, Button } from '@sercop/design-system';
import { api, setBaseUrl, setToken } from '@sercop/api-client';
import { setProviderId, getToken, getProviderId } from '../lib/auth';
import { SupplierShell } from '../components/SupplierShell';

import { Step1Terms } from './Step1Terms';
import { Step2Identifier } from './Step2Identifier';
import { Step3Info, Step3InfoData } from './Step3Info';
import { Step4Address, Step4AddressData } from './Step4Address';
import { Step5Contacts, Step5ContactsData } from './Step5Contacts';
import { Step6Products } from './Step6Products';
import { Step7Indicators, Step7IndicatorsData } from './Step7Indicators';
import { Step8Finalize } from './Step8Finalize';

setBaseUrl(process.env.NEXT_PUBLIC_API_URL || '');

const WIZARD_STEPS = [
  'Términos',
  'Credenciales',
  'Información',
  'Dirección',
  'Contactos',
  'Productos',
  'Indicadores',
  'Finalizar'
];

interface RegistrationData extends Step3InfoData, Step4AddressData, Step5ContactsData, Step7IndicatorsData {
  email?: string;
  name?: string;
  activityCodes?: string[];
}

export default function RegistroPage() {
  const router = useRouter();
  
  // Master State
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [providerId, setLocalProviderId] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState<Partial<RegistrationData>>({});

  // 1. Load Draft on Mount
  useEffect(() => {
    const t = getToken();
    const pid = getProviderId();
    if (t && pid) {
      setToken(t);
      setLocalProviderId(pid);
      api.getProvider(pid).then((p) => {
        const step = p.registrationStep && p.registrationStep >= 1 ? Math.min(p.registrationStep, 8) : 3;
        const loadedData = {
          email: p.identifier || '', // assuming email is identifier for now for step 2
          name: p.name || '',
          identifier: p.identifier || '',
          legalName: p.legalName || '',
          tradeName: p.tradeName || '',
          province: p.province || '',
          canton: p.canton || '',
          address: p.address || '',
          activityCodes: p.activityCodes || [],
          // Merge JSON extra data
          ...(p.registrationData && typeof p.registrationData === 'object' ? p.registrationData : {})
        };
        setFormData(loadedData);
        setCurrentStep(step);
      }).catch(err => {
        console.error('Error loading draft', err);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false); // No draft, start at step 1
    }
  }, []);

  // Helpers
  const goNext = () => setCurrentStep(s => Math.min(s + 1, 8));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 1));
  const updateData = (newData: Partial<RegistrationData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  // Step 2 Create Initial Provider
  const handleStep2 = async (data: { email: string; name: string }) => {
    try {
      updateData(data);
      // Create Provider
      const provider = await api.createProvider({
        name: data.name.trim(),
        identifier: data.email.trim()
      });
      // Mock login for MVP token
      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, role: 'supplier', identifier: data.email })
      });
      if (loginRes.ok) {
        const json = await loginRes.json();
        setToken(json.token);
        setProviderId(json.providerId || provider.id);
        setLocalProviderId(json.providerId || provider.id);
        
        // Save Step 2 progress
        await saveProgress(2, { email: data.email });
        goNext();
      } else {
        throw new Error('Error al iniciar sesión tras crear cuenta.');
      }
    } catch (e: any) {
      throw new Error(e.message || 'Error de conexión');
    }
  };

  // Generic fastify API patch
  const saveProgress = async (step: number, stepData: Partial<RegistrationData>) => {
    const updated = { ...formData, ...stepData };
    updateData(stepData);
    
    // Si tenemos providerId, hacemos API call
    if (providerId) {
      await api.updateProvider(providerId, {
        registrationStep: step + 1,
        name: updated.name,
        identifier: updated.identifier,
        legalName: updated.legalName,
        tradeName: updated.tradeName,
        province: updated.province,
        canton: updated.canton,
        address: updated.address,
        activityCodes: updated.activityCodes,
        registrationData: {
           contactIdNumber: updated.contactIdNumber,
           contactName: updated.contactName,
           contactRole: updated.contactRole,
           contactEmail: updated.contactEmail,
           annualSales: updated.annualSales,
           externalCapitalPercentage: updated.externalCapitalPercentage,
           employeesCount: updated.employeesCount,
           totalAssets: updated.totalAssets,
           fixedAssets: updated.fixedAssets,
           realEstate: updated.realEstate,
           netWorth: updated.netWorth
        }
      });
    }
    goNext();
  };

  const handleFinish = async () => {
    if (!providerId) return;
    try {
      // Validaciones finales o envío de status 'active' real.
      await api.updateProvider(providerId, {
        registrationStep: 9, // Finished
        status: 'active'
      });
      router.push('/login?registered=1');
    } catch (err: any) {
      throw err;
    }
  };

  if (loading) {
    return (
      <SupplierShell activeId="registro">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 flex justify-center items-center font-medium animate-pulse text-neutral-400">
          Cargando asistente de registro...
        </div>
      </SupplierShell>
    );
  }

  return (
    <SupplierShell activeId="registro">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-2xl font-semibold">Registro de Proveedor del Estado</h1>
        <p className="mb-8 text-neutral-500">Complete los siguientes {WIZARD_STEPS.length} pasos para habilitar su cuenta en el RUP.</p>

        <Card className="mb-8 px-4 py-6 overflow-x-auto shadow-sm">
          <Stepper steps={WIZARD_STEPS} currentStep={currentStep} className="min-w-[600px]" />
        </Card>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        <div className="w-full">
          {currentStep === 1 && <Step1Terms onNext={goNext} />}
          {currentStep === 2 && <Step2Identifier initialEmail={formData.email} onNext={handleStep2} />}
          {currentStep === 3 && <Step3Info initialData={formData} onBack={goBack} onNext={(d) => saveProgress(3, d)} />}
          {currentStep === 4 && <Step4Address initialData={formData} onBack={goBack} onNext={(d) => saveProgress(4, d)} />}
          {currentStep === 5 && <Step5Contacts initialData={formData} onBack={goBack} onNext={(d) => saveProgress(5, d)} />}
          {currentStep === 6 && <Step6Products initialActivityCodes={formData.activityCodes || []} onBack={goBack} onNext={(c) => saveProgress(6, { activityCodes: c })} />}
          {currentStep === 7 && <Step7Indicators initialData={formData} onBack={goBack} onNext={(d) => saveProgress(7, d)} />}
          {currentStep === 8 && <Step8Finalize summaryData={formData} onBack={goBack} onFinish={handleFinish} />}
        </div>
      </div>
    </SupplierShell>
  );
}
