export interface NXResult {
  nxResult: boolean;
  status: number | boolean;
  code: number;
  info: boolean;
  warning: boolean;
  error: boolean;
  message: string;
  errorMsg: string;
  data: any;
}

export const NXResultInit: NXResult = {
  nxResult: true,
  status: false,
  code: -1,
  info: false,
  warning: false,
  error: false,
  message: '',
  errorMsg: '',
  data: null,
};

export interface ApiResponse {
  message?: string;
  status?: number;
  data?: any;
  [key: string]: any;
}

