import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { NewCaseForm, initialCaseForm } from "./types";

interface CaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: NewCaseForm;
  onSave: (data: NewCaseForm) => Promise<boolean>;
  isEditing?: boolean;
}

const years = ['2025', '2024', '2023', '2022', '2021'];
const countries = ['美国', '英国', '加拿大', '澳大利亚', '香港', '新加坡', '日本', '韩国', '欧洲其他'];

export default function CaseFormDialog({ 
  open, 
  onOpenChange, 
  initialData, 
  onSave,
  isEditing = false 
}: CaseFormDialogProps) {
  const [formData, setFormData] = useState<NewCaseForm>(initialData || initialCaseForm);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          const targetWidth = 800;
          const targetHeight = 450;
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          const sourceRatio = img.width / img.height;
          const targetRatio = targetWidth / targetHeight;
          
          let sx: number, sy: number, sWidth: number, sHeight: number;
          if (sourceRatio > targetRatio) {
            sHeight = img.height;
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
            sy = 0;
          } else {
            sWidth = img.width;
            sHeight = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sHeight) / 2;
          }
          
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
          setFormData({...formData, offer_image: canvas.toDataURL('image/jpeg', 0.9)});
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.year || !formData.country || !formData.university || !formData.profile_style || !formData.academic_background) {
      return;
    }
    setSaving(true);
    const success = await onSave(formData);
    setSaving(false);
    if (success) {
      setFormData(initialCaseForm);
      onOpenChange(false);
    }
  };

  const addActivity = () => {
    setFormData({...formData, activities: [...formData.activities, '']});
  };

  const removeActivity = (index: number) => {
    setFormData({...formData, activities: formData.activities.filter((_, i) => i !== index)});
  };

  const updateActivity = (index: number, value: string) => {
    const newActivities = [...formData.activities];
    newActivities[index] = value;
    setFormData({...formData, activities: newActivities});
  };

  const addCourse = () => {
    setFormData({...formData, courses: [...formData.courses, '']});
  };

  const removeCourse = (index: number) => {
    setFormData({...formData, courses: formData.courses.filter((_, i) => i !== index)});
  };

  const updateCourse = (index: number, value: string) => {
    const newCourses = [...formData.courses];
    newCourses[index] = value;
    setFormData({...formData, courses: newCourses});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑案例' : '添加录取案例'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>年份 *</Label>
              <Select value={formData.year} onValueChange={v => setFormData({...formData, year: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>国家/地区 *</Label>
              <Select value={formData.country} onValueChange={v => setFormData({...formData, country: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择国家" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>大学名称 *</Label>
              <Input 
                value={formData.university} 
                onChange={e => setFormData({...formData, university: e.target.value})}
                placeholder="如：哈佛大学"
              />
            </div>
            <div className="space-y-2">
              <Label>专业</Label>
              <Input 
                value={formData.major} 
                onChange={e => setFormData({...formData, major: e.target.value})}
                placeholder="如：计算机科学"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Offer图片</Label>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                上传图片
              </Button>
              {formData.offer_image && (
                <div className="relative">
                  <img src={formData.offer_image} alt="Preview" className="h-16 rounded" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setFormData({...formData, offer_image: ''})}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>学生画像 *</Label>
            <Textarea 
              value={formData.profile_style}
              onChange={e => setFormData({...formData, profile_style: e.target.value})}
              placeholder="描述学生的整体形象和特点..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>学术背景 *</Label>
            <Textarea 
              value={formData.academic_background}
              onChange={e => setFormData({...formData, academic_background: e.target.value})}
              placeholder="描述学生的学术成就和背景..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>课外活动</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addActivity}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {formData.activities.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input 
                    value={activity}
                    onChange={e => updateActivity(idx, e.target.value)}
                    placeholder={`活动 ${idx + 1}`}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeActivity(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>相关课程/项目</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addCourse}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {formData.courses.map((course, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input 
                    value={course}
                    onChange={e => updateCourse(idx, e.target.value)}
                    placeholder={`课程 ${idx + 1}`}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeCourse(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
