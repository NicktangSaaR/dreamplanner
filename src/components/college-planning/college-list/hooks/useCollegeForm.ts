
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { formSchema, CollegeFormValues } from "../collegeSchema";
import { CollegeApplication } from "../types";
import { getCollegeInfo } from "../useCollegeInfo";

export function useCollegeForm(
  applicationData?: CollegeApplication | null,
  onSubmit?: (values: CollegeFormValues, applicationId?: string) => Promise<void>,
  onSuccess?: () => void
) {
  const [isLoadingCollegeInfo, setIsLoadingCollegeInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCollegeInfo, setHasCollegeInfo] = useState(false);
  
  const form = useForm<CollegeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      college_name: "",
      major: "",
      degree: undefined,
      category: undefined,
      college_url: "",
      avg_gpa: null,
      avg_sat: null,
      avg_act: null,
      sat_75th: null,
      act_75th: null,
      institution_type: null,
      state: null,
      city: null,
      test_optional: null,
      notes: null,
    },
  });

  useEffect(() => {
    if (applicationData) {
      form.reset({
        college_name: applicationData.college_name,
        major: applicationData.major,
        degree: applicationData.degree as "Bachelor" | "Master",
        category: applicationData.category as any,
        college_url: applicationData.college_url,
        avg_gpa: applicationData.avg_gpa || null,
        avg_sat: applicationData.avg_sat || null,
        avg_act: applicationData.avg_act || null,
        sat_75th: applicationData.sat_75th || null,
        act_75th: applicationData.act_75th || null,
        institution_type: applicationData.institution_type as "Public" | "Private" || null,
        state: applicationData.state || null,
        city: applicationData.city || null,
        test_optional: applicationData.test_optional || null,
        notes: applicationData.notes || null,
      });
      setHasCollegeInfo(true);
    }
  }, [applicationData, form]);

  useEffect(() => {
    const subscription = form.watch(async (value, { name }) => {
      if (name === 'college_name' && value.college_name && !applicationData) {
        setIsLoadingCollegeInfo(true);
        setHasCollegeInfo(false);
        try {
          const collegeInfo = await getCollegeInfo(value.college_name);
          if (collegeInfo) {
            form.setValue('test_optional', collegeInfo.test_optional || null);
            form.setValue('avg_gpa', collegeInfo.avg_gpa || null);
            form.setValue('avg_sat', collegeInfo.avg_sat || null);
            form.setValue('avg_act', collegeInfo.avg_act || null);
            form.setValue('sat_75th', collegeInfo.sat_75th || null);
            form.setValue('act_75th', collegeInfo.act_75th || null);
            form.setValue('institution_type', collegeInfo.institution_type || null);
            form.setValue('state', collegeInfo.state || null);
            form.setValue('city', collegeInfo.city || null);
            form.setValue('college_url', collegeInfo.website_url || null);
            setHasCollegeInfo(true);
          }
        } catch (error) {
          console.error('Error fetching college info:', error);
          // Even if there's an error fetching additional info, we should still allow form submission
          setHasCollegeInfo(true);
        } finally {
          setIsLoadingCollegeInfo(false);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, applicationData]);

  const handleSubmit = async (values: CollegeFormValues) => {
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values, applicationData?.id);
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    form,
    isLoadingCollegeInfo,
    isSubmitting,
    hasCollegeInfo,
    handleSubmit
  };
}
