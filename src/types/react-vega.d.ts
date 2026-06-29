declare module 'react-vega' {
  import * as React from 'react';

  export type VegaLiteProps = {
    spec: any;
    data?: any;
    actions?: boolean | any;
    onNewView?: (view: any) => void;
    renderer?: 'canvas' | 'svg';
    width?: number | string;
    height?: number | string;
    [key: string]: any;
  };

  export const VegaLite: React.ComponentType<VegaLiteProps>;
}
