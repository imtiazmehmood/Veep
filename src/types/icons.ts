import { SvgProps } from 'react-native-svg';

/**
 * Base props for all SVG icon components
 */
export interface IconProps extends SvgProps {
  width?: number | string;
  height?: number | string;
  fill?: string;
  color?: string;
}

