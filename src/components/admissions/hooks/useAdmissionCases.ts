import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdmissionCase, NewCaseForm } from '../types';
import { toast } from 'sonner';

export function useAdmissionCases() {
  const [cases, setCases] = useState<AdmissionCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('admission_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse JSONB fields
      const parsedData = (data || []).map(item => ({
        ...item,
        activities: Array.isArray(item.activities) ? item.activities as string[] : [],
        courses: Array.isArray(item.courses) ? item.courses as string[] : []
      }));
      
      setCases(parsedData as AdmissionCase[]);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载案例失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const saveCase = async (newCase: NewCaseForm, editingCaseId?: number) => {
    const cleaned = {
      year: newCase.year,
      country: newCase.country,
      university: newCase.university,
      major: newCase.major || null,
      offer_image: newCase.offer_image || null,
      profile_style: newCase.profile_style,
      academic_background: newCase.academic_background,
      activities: newCase.activities?.filter(a => a.trim()) || [],
      courses: newCase.courses?.filter(c => c.trim()) || []
    };

    try {
      if (editingCaseId) {
        const { error } = await supabase
          .from('admission_cases')
          .update(cleaned)
          .eq('id', editingCaseId);
        if (error) throw error;
        toast.success('案例更新成功');
      } else {
        const { error } = await supabase
          .from('admission_cases')
          .insert([cleaned]);
        if (error) throw error;
        toast.success('案例添加成功');
      }
      
      await loadCases();
      return true;
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
      return false;
    }
  };

  const deleteCase = async (id: number) => {
    try {
      const { error } = await supabase
        .from('admission_cases')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadCases();
      toast.success('案例已删除');
      return true;
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败，请重试');
      return false;
    }
  };

  return {
    cases,
    isLoading,
    loadCases,
    saveCase,
    deleteCase
  };
}
