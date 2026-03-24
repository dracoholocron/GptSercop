# Componentes SWIFT

Este directorio contiene componentes reutilizables para trabajar con mensajes y campos SWIFT en la aplicación GlobalCMX.

## SwiftMessageViewer

Componente transversal para visualizar mensajes SWIFT formateados desde cualquier producto financiero.

### Características

- ✅ **Formato SWIFT Estándar**: Genera automáticamente el mensaje con el formato SWIFT correcto
- 📋 **Copiar al Portapapeles**: Permite copiar el mensaje completo con un click
- 💾 **Descarga como Archivo**: Exporta el mensaje como archivo .txt
- 🏷️ **Badges Informativos**: Muestra metadata relevante del mensaje
- 🎨 **Monospace Font**: Visualización clara con tipografía apropiada para mensajes SWIFT
- 🔧 **Altamente Configurable**: Adapta la visualización según necesidades específicas

### Uso Básico

```tsx
import { SwiftMessageViewer } from '../components/swift/SwiftMessageViewer';

<SwiftMessageViewer
  messageType="MT700"
  fields={swiftFieldsData}
  title="Mensaje SWIFT - Carta de Crédito"
  description="Vista previa del mensaje antes de enviar"
  allowCopy
  allowDownload
/>
```

### Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `messageType` | `string` | ✅ | - | Tipo de mensaje SWIFT (ej: MT700, MT760, MT799) |
| `fields` | `Record<string, any>` | ✅ | - | Datos de los campos SWIFT con formato `:XX:` |
| `title` | `string` | ❌ | `"Mensaje {messageType}"` | Título personalizado del visor |
| `description` | `string` | ❌ | - | Descripción adicional del mensaje |
| `showBadges` | `boolean` | ❌ | `true` | Mostrar badges informativos |
| `allowCopy` | `boolean` | ❌ | `true` | Habilitar botón de copiar |
| `allowDownload` | `boolean` | ❌ | `true` | Habilitar botón de descarga |
| `metadata` | `object` | ❌ | `{}` | Información adicional para badges |

### Formato de Campos

Los campos SWIFT deben proporcionarse en el formato esperado:

```typescript
const swiftFieldsData = {
  ':20:': 'LC-2024-001234',
  ':23:': 'PREADV',
  ':31C:': '2024-12-02',
  ':31D:': '2025-06-02',
  ':32B:': {
    currency: 'USD',
    amount: '100000.00'
  },
  ':40A:': 'IRREVOCABLE',
  ':50:': 'APPLICANT NAME\nADDRESS LINE 1\nCITY, COUNTRY',
  ':59:': 'BENEFICIARY NAME\nADDRESS LINE 1\nCITY, COUNTRY',
  // ... más campos
};
```

### Metadata

El objeto `metadata` permite agregar información adicional que se mostrará en badges:

```typescript
metadata={{
  reference: 'LC-123456',
  amount: '100,000.00',
  currency: 'USD',
  issueDate: '2024-12-02',
  expiryDate: '2025-06-02',
  applicant: 'Company ABC',
  beneficiary: 'Company XYZ',
  // Cualquier otro campo personalizado
}}
```

### Ejemplo Completo

```tsx
import { SwiftMessageViewer } from '../components/swift/SwiftMessageViewer';

function LCIssuanceWizard() {
  const [swiftFieldsData, setSwiftFieldsData] = useState({
    ':20:': 'LC-2024-001234',
    ':31C:': '2024-12-02',
    ':31D:': '2025-06-02',
    ':32B:': {
      currency: 'USD',
      amount: '100000.00'
    },
    ':40A:': 'IRREVOCABLE',
    ':50:': 'APPLICANT COMPANY\nMAIN STREET 123\nNEW YORK, USA',
    ':59:': 'BENEFICIARY COMPANY\nAVENUE 456\nLONDON, UK',
  });

  return (
    <SwiftMessageViewer
      messageType="MT700"
      fields={swiftFieldsData}
      title="Carta de Crédito de Importación"
      description="Revise el mensaje SWIFT antes de finalizar"
      showBadges={true}
      allowCopy={true}
      allowDownload={true}
      metadata={{
        reference: swiftFieldsData[':20:'],
        amount: parseFloat(swiftFieldsData[':32B:'].amount).toLocaleString(),
        currency: swiftFieldsData[':32B:'].currency,
        issueDate: swiftFieldsData[':31C:'],
        expiryDate: swiftFieldsData[':31D:'],
      }}
    />
  );
}
```

### Productos Compatibles

Este componente está diseñado para ser usado en todos los productos de comercio exterior:

- ✅ **Cartas de Crédito** (MT700, MT707, MT710, etc.)
- ✅ **Garantías Bancarias** (MT760, MT767, etc.)
- ✅ **Cobranzas Documentarias** (MT410, MT412, MT416, MT420, etc.)
- ✅ **Mensajes Libres** (MT799)
- ✅ **Otros productos SWIFT** (Cualquier mensaje MTxxx)

### Generación del Mensaje

El componente genera automáticamente el mensaje SWIFT con el siguiente formato:

```
{1:MT700}

:20:LC-2024-001234
:31C:2024-12-02
:31D:2025-06-02
:32B:USD100000.00
:40A:IRREVOCABLE
:50:APPLICANT COMPANY
MAIN STREET 123
NEW YORK, USA
:59:BENEFICIARY COMPANY
AVENUE 456
LONDON, UK

-}
```

### Características Avanzadas

#### Ordenamiento Automático

Los campos se ordenan automáticamente por su número de tag para mantener el formato estándar SWIFT.

#### Filtrado de Campos Vacíos

Los campos vacíos o sin valor se excluyen automáticamente del mensaje generado.

#### Manejo de Objetos Complejos

El componente maneja correctamente campos que contienen objetos (como `:32B:` con currency y amount).

#### Formato Multilinea

Los campos que contienen saltos de línea (`\n`) se formatean correctamente en el mensaje.

### Notas de Implementación

- El componente usa el hook `useTheme` para adaptarse a los modos claro/oscuro
- La visualización del mensaje usa fondo oscuro con texto verde para mejor legibilidad
- Los botones de acción están siempre accesibles en la parte superior
- El mensaje se puede copiar en cualquier momento sin necesidad de seleccionar texto

### Próximas Mejoras

- [ ] Validación de formato SWIFT en tiempo real
- [ ] Resaltado de sintaxis por tipo de campo
- [ ] Previsualización con/sin campos opcionales
- [ ] Exportación a múltiples formatos (JSON, XML, CSV)
- [ ] Comparación de versiones de mensajes
- [ ] Plantillas predefinidas por tipo de mensaje

## Otros Componentes

### DynamicSwiftField
Componente para renderizar campos SWIFT individuales con validación y formato dinámico.

### SwiftFieldRenderer
Renderizador de campos SWIFT con soporte para diferentes tipos de datos.

### ContextualAlertPanel
Panel de alertas contextuales para guiar al usuario en el llenado de campos SWIFT relacionados.
