'use client'

import { Suspense, lazy } from 'react'

import type { ComponentType } from 'react'

const loadRuntimeModule = (moduleName: string) =>
  (new Function('m', 'return import(m)') as any)(moduleName) as Promise<any>

const Spline = lazy(async (): Promise<{ default: ComponentType<any> }> => {
  try {
    const mod: any = await loadRuntimeModule('@splinetool/react-spline')
    const Component: any = mod?.default || mod
    return { default: (props: any) => <Component {...props} /> }
  } catch {
    return { default: (_props: any) => null }
  }
})

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
