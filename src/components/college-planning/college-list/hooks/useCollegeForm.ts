
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
      max_sat: null,
      max_act: null,
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
        max_sat: applicationData.max_sat || null,
        max_act: applicationData.max_act || null,
        institution_type: applicationData.institution_type as "Public" | "Private" || null,
        state: applicationData.state || null,
        city: applicationData.city || null,
        test_optional: applicationData.test_optional || null,
        notes: applicationData.notes || null,
      });
      setHasCollegeInfo(true);
    }
  }, [applicationData, form]);

  const handleSubmit = async (values: CollegeFormValues) => {
    if (onSubmit) {
      setIsSubmitting(true);
      setIsLoadingCollegeInfo(true);
      try {
        // If this is a new application (no applicationData), fetch college info
        if (!applicationData) {
          const collegeInfo = await getCollegeInfo(values.college_name);
          if (collegeInfo) {
            // Merge college info with form values
            values = {
              ...values,
              avg_gpa: collegeInfo.avg_gpa || null,
              avg_sat: collegeInfo.avg_sat || null,
              avg_act: collegeInfo.avg_act || null,
              max_sat: collegeInfo.max_sat || null,
              max_act: collegeInfo.max_act || null,
              institution_type: collegeInfo.institution_type || null,
              state: collegeInfo.state || null,
              city: collegeInfo.city || null,
              test_optional: collegeInfo.test_optional || null,
              college_url: collegeInfo.website_url || values.college_url,
            };
          }
        }
        
        await onSubmit(values, applicationData?.id);
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
      } finally {
        setIsSubmitting(false);
        setIsLoadingCollegeInfo(false);
        setHasCollegeInfo(true);
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
