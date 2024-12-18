// types.ts
export interface Template {
    templateId: string;
    image: string;
    projectID: string;
    name: string;
  }
  
  export interface ApiResponse {
    records: Array<{
      fields: {
        template_ID: string;
      };
    }>;
  }
  
