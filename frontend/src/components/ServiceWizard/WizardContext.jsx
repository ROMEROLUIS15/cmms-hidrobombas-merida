import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';
import { toast } from 'sonner';

const WizardContext = createContext();

export const useWizard = () => useContext(WizardContext);

const DRAFT_KEY = 'maintenance_draft';

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialData = {
  client_id: '',
  equipment_id: '',
  visit_type: 'mensual',
  system_name: '',
  report_date: getLocalDateString(),
  technician_name: '',
  client_signature_name: '',
  signature_base64: '',
  observations: '',

  water_energy_data: {
    voltage_r_s: '', voltage_r_n: '',
    voltage_s_t: '', voltage_s_n: '',
    voltage_t_r: '', voltage_t_n: '',
    water_level: 'empty',
    float_contact_na: '',
    float_contact_na_2: '',
    led_empty_tank: '',
    volts_min: '', volts_max: '',
    time_1: '', time_2: ''
  },

  motor_1_data: {
    motor_hp: '', amperage: '', phase_r: '', phase_s: '', phase_t: '',
    bobina_value: '', contactos_value: '', contactor_working: false,
    thermal_amp: '', thermal_nc: '', thermal_no: '',
    motor_temp: '', voluta_temp: '', thermal_temp: ''
  },
  motor_2_data: {
    motor_hp: '', amperage: '', phase_r: '', phase_s: '', phase_t: '',
    bobina_value: '', contactos_value: '', contactor_working: false,
    thermal_amp: '', thermal_nc: '', thermal_no: '',
    motor_temp: '', voluta_temp: '', thermal_temp: ''
  },
  motor_3_data: {
    motor_hp: '', amperage: '', phase_r: '', phase_s: '', phase_t: '',
    bobina_value: '', contactos_value: '', contactor_working: false,
    thermal_amp: '', thermal_nc: '', thermal_no: '',
    motor_temp: '', voluta_temp: '', thermal_temp: ''
  },

  control_peripherals_data: {
    breaker_tripolar_1: '', breaker_tripolar_2: '', breaker_tripolar_3: '',
    breaker_control: '',
    relay_alternator: '', relay_control_level: '',
    preset_work: '', preset_emergency: '', preset_compressor: '',
    electrode_level: '', valve_level: '', safety_valve: '',
    manometer: '', pressure_on: '', pressure_off: '',
    compressor_oil: '', compressor_belt: '', valve_vents: '',
    pilot_lights: '', switches: '', timer: '',
    pump_1_on_minutes: '', pump_1_rest_minutes: '',
    pump_2_on_minutes: '', pump_2_rest_minutes: '',
    pump_1_noise_db: '', pump_2_noise_db: ''
  }
};

export const WizardProvider = ({ children }) => {
  const [formData, setFormData] = useState(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load draft from IndexedDB on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await get(DRAFT_KEY);
        if (draft) {
          setFormData(draft);
          toast.info('Se cargó un borrador guardado localmente', { duration: 3000 });
        }
      } catch (error) {
        console.error('Error loading draft:', error.message);
      } finally {
        setDraftLoaded(true);
      }
    };
    loadDraft();
  }, []);

  // Save to IndexedDB automatically when formData changes
  useEffect(() => {
    if (draftLoaded) {
      set(DRAFT_KEY, formData).catch(err => console.error('Error saving draft:', err.message));
    }
  }, [formData, draftLoaded]);

  const updateFormData = useCallback((section, field, value) => {
    setFormData(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const clearDraft = async () => {
    try {
      await del(DRAFT_KEY);
      setFormData(initialData);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error clearing draft:', error.message);
    }
  };

  const setStep = (step) => {
    if (step >= 0 && step <= 12) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextStep = () => setStep(currentStep + 1);
  const prevStep = () => setStep(currentStep - 1);

  return (
    <WizardContext.Provider
      value={{
        formData,
        setFormData,
        updateFormData,
        currentStep,
        setStep,
        nextStep,
        prevStep,
        isOffline,
        clearDraft,
        clearOfflineDraft: clearDraft
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};
