import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './store'

// Versiones tipadas de useDispatch/useSelector: úsalas siempre en lugar de las originales.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
