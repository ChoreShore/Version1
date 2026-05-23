const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1 / KM_TO_MILES;

export function milesToKm(miles: number): number {
  return miles * MILES_TO_KM;
}

export function kmToMiles(km: number): number {
  return km * KM_TO_MILES;
}
