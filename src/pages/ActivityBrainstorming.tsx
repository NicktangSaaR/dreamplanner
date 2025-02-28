
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrainCircuit, Lightbulb, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function ActivityBrainstorming() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activityTitle, setActivityTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [currentIdea, setCurrentIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddIdea = () => {
    if (currentIdea.trim()) {
      setIdeas([...ideas, currentIdea.trim()]);
      setCurrentIdea("");
      toast.success("已添加新点子");
    }
  };

  const handleRemoveIdea = (index: number) => {
    const newIdeas = [...ideas];
    newIdeas.splice(index, 1);
    setIdeas(newIdeas);
  };

  const handleReset = () => {
    if (ideas.length > 0 || activityTitle || description) {
      if (confirm("确定要重置所有内容吗？")) {
        setActivityTitle("");
        setDescription("");
        setIdeas([]);
        setCurrentIdea("");
        toast.info("已重置所有内容");
      }
    }
  };

  const handleGenerateIdeas = async () => {
    if (!activityTitle) {
      toast.error("请先输入活动标题");
      return;
    }

    setIsGenerating(true);
    try {
      // Mock API call - in the future this could be connected to an AI service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate some mock ideas based on the activity title
      const generatedIdeas = [
        `基于${activityTitle}的团队合作活动`,
        `${activityTitle}相关的社区服务项目`,
        `展示${activityTitle}技能的竞赛或展示`,
        `围绕${activityTitle}的研究或探索项目`
      ];
      
      setIdeas([...ideas, ...generatedIdeas]);
      toast.success("已生成新点子建议");
    } catch (error) {
      console.error("Error generating ideas:", error);
      toast.error("生成点子失败，请稍后再试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!activityTitle) {
      toast.error("请输入活动标题");
      return;
    }
    
    if (ideas.length === 0) {
      toast.error("请至少添加一个点子");
      return;
    }

    // This is where you would save the data to a database
    // For now, we'll just show a success message
    toast.success("活动创意已保存");
    
    // In a real implementation, you would save to a database here
    console.log({
      title: activityTitle,
      description,
      ideas,
      userId: profile?.id
    });
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">活动创意构思器</h1>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">测试版</span>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>返回</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>活动基本信息</CardTitle>
            <CardDescription>输入你想要构思的活动信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity-title">活动标题</Label>
              <Input 
                id="activity-title"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="输入活动标题，例如：环保志愿者活动"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">活动描述 (可选)</Label>
              <Textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述你想要构思的活动目的和范围..."
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              重置
            </Button>
            <Button 
              onClick={handleGenerateIdeas} 
              disabled={isGenerating || !activityTitle}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              {isGenerating ? "生成中..." : "自动生成点子"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>活动点子列表</CardTitle>
            <CardDescription>添加或生成关于这个活动的创意点子</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={currentIdea}
                onChange={(e) => setCurrentIdea(e.target.value)}
                placeholder="输入新点子..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddIdea();
                  }
                }}
              />
              <Button onClick={handleAddIdea}>添加</Button>
            </div>
            
            <div className="border rounded-md p-4 min-h-[200px] bg-gray-50">
              {ideas.length > 0 ? (
                <ul className="space-y-2">
                  {ideas.map((idea, index) => (
                    <li key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                      <span>{idea}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveIdea(index)}
                        className="h-8 w-8 p-0"
                      >
                        &times;
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                  <p>还没有添加点子。开始添加或使用自动生成功能！</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={!activityTitle || ideas.length === 0}
            >
              保存活动创意
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
