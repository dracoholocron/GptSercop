/**
 * Componentes SWIFT - Barrel Export
 *
 * Este archivo exporta todos los componentes relacionados con mensajes SWIFT
 * para facilitar su importación en otras partes de la aplicación.
 */

export { SwiftMessageViewer } from './SwiftMessageViewer';
export { SwiftFieldRenderer } from './SwiftFieldRenderer';
export { DynamicSwiftField } from './DynamicSwiftField';
export { ContextualAlertPanel } from './ContextualAlertPanel';
export { SF2ImportButton, mapSwiftFieldsToForm, getDateFieldCodes, convertSwiftDateToISO, LC_SWIFT_FIELD_MAPPING, GUARANTEE_SWIFT_FIELD_MAPPING } from './SF2ImportButton';
export type { SF2ImportResult, SF2ImportButtonProps } from './SF2ImportButton';
