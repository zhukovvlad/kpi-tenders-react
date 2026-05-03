// USE_MOCKS — в dev-режиме включено по умолчанию, потому что бекенд для большинства
// новых эндпоинтов ещё не реализован. Чтобы насильно ходить в реальный API в dev,
// нужно задать VITE_USE_MOCKS=false. В production моки никогда не активны.
export const USE_MOCKS =
  import.meta.env.PROD === false &&
  import.meta.env.VITE_USE_MOCKS !== "false"

// Имитация сетевой задержки, чтобы UI-состояния (loading/empty) выглядели правдоподобно.
export function mockDelay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function mockReject<T = never>(message: string, ms = 220): Promise<T> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms),
  )
}
