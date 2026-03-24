/**
 * GlobalCMX Unified Notification System
 *
 * Sistema de notificaciones transversal y unificado que respeta el diseño de marca de GlobalCMX.
 * Soporta modo claro/oscuro y se integra con el sistema de traducciones i18n.
 *
 * Uso:
 *   import { toaster } from '@/components/ui/toaster';
 *
 *   toaster.create({
 *     title: t('common.success', 'Éxito'),
 *     description: t('operations.approvalSuccessMessage', 'Operación aprobada'),
 *     type: 'success',
 *     duration: 5000,
 *   });
 *
 * Tipos disponibles: 'success' | 'error' | 'warning' | 'info'
 */
import { Toaster as ChakraToaster, createToaster, Toast } from "@chakra-ui/react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from "react-icons/fi";

export const toaster = createToaster({
  placement: "top",
  pauseOnPageIdle: true,
  overlap: true,
  gap: 16,
});

/**
 * Colores de marca GlobalCMX para notificaciones
 * Diseño con header colorido y body con fondo claro
 */
const NOTIFICATION_COLORS = {
  success: {
    light: {
      headerBg: 'linear-gradient(135deg, #38A169 0%, #2F855A 100%)',
      bodyBg: '#F0FFF4',
      border: '#2F855A',
      icon: '#FFFFFF',
      title: '#FFFFFF',
      description: '#22543D',
      closeBtn: '#FFFFFF',
    },
    dark: {
      headerBg: 'linear-gradient(135deg, #276749 0%, #22543D 100%)',
      bodyBg: '#1C4532',
      border: '#38A169',
      icon: '#68D391',
      title: '#FFFFFF',
      description: '#C6F6D5',
      closeBtn: '#68D391',
    },
  },
  error: {
    light: {
      headerBg: 'linear-gradient(135deg, #E53E3E 0%, #C53030 100%)',
      bodyBg: '#FFF5F5',
      border: '#C53030',
      icon: '#FFFFFF',
      title: '#FFFFFF',
      description: '#742A2A',
      closeBtn: '#FFFFFF',
    },
    dark: {
      headerBg: 'linear-gradient(135deg, #C53030 0%, #9B2C2C 100%)',
      bodyBg: '#63171B',
      border: '#E53E3E',
      icon: '#FC8181',
      title: '#FFFFFF',
      description: '#FED7D7',
      closeBtn: '#FC8181',
    },
  },
  warning: {
    light: {
      headerBg: 'linear-gradient(135deg, #FFB800 0%, #CC9300 100%)',
      bodyBg: '#FFFAF0',
      border: '#CC9300',
      icon: '#1A202C',
      title: '#1A202C',
      description: '#744210',
      closeBtn: '#1A202C',
    },
    dark: {
      headerBg: 'linear-gradient(135deg, #CC9300 0%, #996E00 100%)',
      bodyBg: '#5C4813',
      border: '#FFB800',
      icon: '#FFD25C',
      title: '#FFFFFF',
      description: '#FEFCBF',
      closeBtn: '#FFD25C',
    },
  },
  info: {
    light: {
      headerBg: 'linear-gradient(135deg, #0073E6 0%, #005CB8 100%)',
      bodyBg: '#EBF8FF',
      border: '#005CB8',
      icon: '#FFFFFF',
      title: '#FFFFFF',
      description: '#2A4365',
      closeBtn: '#FFFFFF',
    },
    dark: {
      headerBg: 'linear-gradient(135deg, #005CB8 0%, #00458A 100%)',
      bodyBg: '#1A365D',
      border: '#0073E6',
      icon: '#4DA6FF',
      title: '#FFFFFF',
      description: '#BEE3F8',
      closeBtn: '#4DA6FF',
    },
  },
};

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

type NotificationType = 'success' | 'error' | 'warning' | 'info';

const getNotificationStyles = (type: NotificationType = 'info', isDarkMode: boolean = false) => {
  const mode = isDarkMode ? 'dark' : 'light';
  const colors = NOTIFICATION_COLORS[type][mode];
  const IconComponent = ICONS[type];

  return {
    colors,
    Icon: IconComponent,
  };
};

// Detectar modo oscuro del sistema o del contexto
const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    const html = document.documentElement;
    return html.classList.contains('dark') ||
           html.getAttribute('data-theme') === 'dark' ||
           window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

export const Toaster = () => {
  return (
    <ChakraToaster toaster={toaster}>
      {(toast) => {
        const type = (toast.type as NotificationType) || 'info';
        const darkMode = isDarkMode();
        const { colors, Icon } = getNotificationStyles(type, darkMode);
        const hasDescription = Boolean(toast.description);

        return (
          <Toast.Root
            key={toast.id}
            style={{
              minWidth: '380px',
              maxWidth: '520px',
              padding: '0',
              borderRadius: '12px',
              boxShadow: darkMode
                ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
              background: hasDescription ? colors.bodyBg : colors.headerBg,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
              animation: 'slideInDown 0.3s ease-out',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header con título - compacto */}
            <div
              style={{
                background: colors.headerBg,
                padding: '10px 16px',
                borderBottom: hasDescription ? `1px solid ${colors.border}` : 'none',
                flexShrink: 0,
                position: 'relative',
                zIndex: 2,
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {/* Icono */}
              <div style={{ color: colors.icon, flexShrink: 0, display: 'flex' }}>
                <Icon size={18} />
              </div>

              {/* Título */}
              <div
                style={{
                  flex: 1,
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: 1.2,
                  color: colors.title,
                }}
              >
                {toast.title}
              </div>

              {/* Botón de cerrar */}
              <Toast.CloseTrigger
                style={{
                  color: colors.closeBtn,
                  opacity: 0.8,
                  padding: '2px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <FiX size={16} />
              </Toast.CloseTrigger>
            </div>

            {/* Body con descripción - más prominente */}
            {hasDescription && (
              <div
                style={{
                  padding: '14px 16px',
                  background: colors.bodyBg,
                  maxHeight: '350px',
                  overflowY: 'auto',
                  flexGrow: 1,
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: colors.description,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {toast.description}
                </div>
              </div>
            )}

            {/* Barra de progreso */}
            <div
              style={{
                height: '5px',
                background: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  height: '100%',
                  width: '100%',
                  background: colors.border,
                  animation: `shrinkWidth ${toast.duration || 5000}ms linear forwards`,
                }}
              />
            </div>
          </Toast.Root>
        );
      }}
    </ChakraToaster>
  );
};

// Agregar estilos de animación al documento
if (typeof document !== 'undefined') {
  const styleId = 'globalcmx-toast-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes shrinkWidth {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }

      @keyframes toastProgress {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Funciones helper para mostrar notificaciones de forma más simple
 * Estas funciones permiten un uso más directo sin necesidad de especificar type
 */
export const notify = {
  success: (title: string, description?: string, duration: number = 5000) => {
    toaster.create({ title, description, type: 'success', duration });
  },
  error: (title: string, description?: string, duration: number = 7000) => {
    toaster.create({ title, description, type: 'error', duration });
  },
  warning: (title: string, description?: string, duration: number = 6000) => {
    toaster.create({ title, description, type: 'warning', duration });
  },
  info: (title: string, description?: string, duration: number = 5000) => {
    toaster.create({ title, description, type: 'info', duration });
  },
};
