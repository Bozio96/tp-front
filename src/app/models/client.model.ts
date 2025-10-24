export interface Client {
  id: number;
  nombre: string;
  apellido: string;
  dni?: string | null;
  cuil?: string | null;
  phone: string;
  domicilio: string;
  foto?: string | null;
}
