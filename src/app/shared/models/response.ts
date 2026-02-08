export interface ErrorResponse {
    error: UksfError;
}

export interface UksfError {
    error: string;
    statusCode: number;
    detailCode: number;
    validation: ValidationReportDataset;
}

export interface ValidationReportDataset {
    reports: ValidationReport[];
}

export interface ValidationReport {
    detail: string;
    error: boolean;
    title: string;
}
