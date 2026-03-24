export interface MensajeSWIFT {
  tipoMensaje: string;
  evento: string;
  monto: number;
  moneda: string;
  paisOrigen: string;
  paisDestino: string;
}

export interface ConfiguracionComision {
  comisionFija?: number;
  comisionPorcentaje?: number;
  comisionMinima?: number;
  comisionMaxima?: number;
}

export interface ComisionResponse {
  mensaje: MensajeSWIFT;
  configuracion: ConfiguracionComision;
  comisionCalculada: number;
  moneda: string;
  detalleCalculo: string;
  reglaAplicada: boolean;
  timestamp: string;
}
