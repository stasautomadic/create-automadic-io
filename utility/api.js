// utils/api.ts
import Airtable from 'airtable';
import { Template } from '../types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY || 'patBs6E6PX8MWrNUS.023ffc613329104691c5527df08677acfab2fe4348d905a9f2043a5e03706ffe' }).base(process.env.AIRTABLE_BASE_ID || 'appkcDmQbp4WGSp5w');
const COMPANY_TABLE_NAME = 'companyGroups'; 
const TEMPLATES_TABLE_NAME = 'videoTemplates'; 

export const getCompanyData = async (companyId) => {
  try {
    const records = await base(COMPANY_TABLE_NAME).select({
      filterByFormula: `RECORD_ID() = "${companyId}"`,
    }).firstPage();
    
    if (records.length === 0) {
      console.log('Company not found');
      return null;
    }

    return records[0].fields;
  } catch (error) {
    console.error('Error fetching company data:', error);
    return null;
  }
};

export const getAllTemplates = async () => {
  try {
    const companyId = localStorage.getItem('company');
    if (!companyId) {
      console.log('Company ID not found in localStorage');
      return [];
    }

    // Get company data to extract projectId
    const companyData = await getCompanyData(companyId);
    if (!companyData) {
      return [];
    }
    // Extract projectId as a string
    const projectId = companyData.projectId;

    // Fetch templates filtered by projectId directly in the Airtable call
    const records = await base(TEMPLATES_TABLE_NAME)
      .select({
        filterByFormula: `FIND('${projectId}', {projectId (from projectId)}) > 0`
      })
      .firstPage();

    if (records.length === 0) {
      console.log('No records found');
      return [];
    }

    return records.map((record) => ({
      templateId_9_16: record.fields.creatomateTemplateID?.toString() ?? '',
      templateId_16_9: record.fields.creatomateTemplateID_format2?.toString() ?? '',
      templateId_1_1: record.fields.creatomateTemplateID_format3?.toString() ?? '',
      templateId_4_5: record.fields.creatomateTemplateID_format4?.toString() ?? '',
      templateId_custom: record.fields.creatomateTemplateID_format5?.toString() ?? '',
      image: (record.fields.image?.[0]?.url?.toString()) ?? '',
      projectID: projectId?.toString() ?? '',
      name: record.fields.templateNames?.toString() ?? '',
    }));

  } catch (error) {
    console.error('Error fetching template data:', error);
    return [];
  }
};
