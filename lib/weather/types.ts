export type Coordinates = {
  readonly latitude: number;
  readonly longitude: number;
};

export type WeatherSnapshot = {
  readonly observedAt: string;
  readonly temperatureC: number;
  readonly apparentTemperatureC: number;
  readonly weatherCode: number;
  readonly conditionLabel: string;
  readonly highC: number;
  readonly lowC: number;
};

export type SchoolLocationSource = {
  readonly name: string;
  readonly region: string | null;
  readonly address: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
};
