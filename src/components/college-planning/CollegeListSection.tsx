import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useParams } from "react-router-dom";

const formSchema = z.object({
  college_name: z.string().min(1, "College name is required"),
  major: z.string().min(1, "Major is required"),
  degree: z.enum(["Bachelor", "Master"], {
    required_error: "Please select a degree type",
  }),
  category: z.enum(["Hard Reach", "Reach", "Hard Target", "Target", "Safety"], {
    required_error: "Please select a category",
  }),
});

const categoryColors: Record<string, string> = {
  "Hard Reach": "bg-red-500",
  "Reach": "bg-orange-500",
  "Hard Target": "bg-yellow-500",
  "Target": "bg-green-500",
  "Safety": "bg-blue-500",
};

async function getCollegeUrl(collegeName: string): Promise<string> {
  try {
    const searchQuery = `${collegeName} official website`;
    const response = await fetch(
      `https://api.perplexity.ai/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a helper that only returns the official website URL of universities. Return only the URL, nothing else.'
            },
            {
              role: 'user',
              content: searchQuery
            }
          ],
          max_tokens: 100,
        })
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch college URL:', await response.text());
      return `https://www.${collegeName.toLowerCase().replace(/ /g, '')}.edu`;
    }

    const data = await response.json();
    const url = data.choices[0].message.content.trim();
    
    // Validate if the response is a valid URL
    try {
      new URL(url);
      return url;
    } catch {
      return `https://www.${collegeName.toLowerCase().replace(/ /g, '')}.edu`;
    }
  } catch (error) {
    console.error('Error getting college URL:', error);
    return `https://www.${collegeName.toLowerCase().replace(/ /g, '')}.edu`;
  }
}

export default function CollegeListSection() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { studentId } = useParams();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      college_name: "",
      major: "",
      degree: undefined,
      category: undefined,
    },
  });

  const { data: applications, refetch } = useQuery({
    queryKey: ["college-applications", studentId],
    queryFn: async () => {
      console.log("Fetching college applications for student:", studentId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // If studentId is provided (counselor view), use that, otherwise use current user's id
      const targetStudentId = studentId || user.id;

      const { data, error } = await supabase
        .from("college_applications")
        .select("*")
        .eq("student_id", targetStudentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }

      console.log("College applications:", data);
      return data;
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Submitting application:", values);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // If studentId is provided (counselor view), use that, otherwise use current user's id
      const targetStudentId = studentId || user.id;

      const collegeUrl = await getCollegeUrl(values.college_name);
      
      const applicationData = {
        college_name: values.college_name,
        major: values.major,
        degree: values.degree,
        category: values.category,
        college_url: collegeUrl,
        student_id: targetStudentId
      };

      const { error } = await supabase
        .from("college_applications")
        .insert(applicationData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "College application added successfully",
      });
      
      setOpen(false);
      form.reset();
      refetch();
    } catch (error) {
      console.error("Error adding application:", error);
      toast({
        title: "Error",
        description: "Failed to add college application",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting application:", id);
      const { error } = await supabase
        .from("college_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "College application removed successfully",
      });
      
      refetch();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({
        title: "Error",
        description: "Failed to remove college application",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">College List</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add College
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add College Application</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="college_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter college name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="major"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Major</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter major" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select degree type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bachelor">Bachelor</SelectItem>
                          <SelectItem value="Master">Master</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Hard Reach">Hard Reach</SelectItem>
                          <SelectItem value="Reach">Reach</SelectItem>
                          <SelectItem value="Hard Target">Hard Target</SelectItem>
                          <SelectItem value="Target">Target</SelectItem>
                          <SelectItem value="Safety">Safety</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Add College
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {applications?.map((app) => (
          <div
            key={app.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-white"
          >
            <div className="flex items-center gap-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{app.college_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {app.major} • {app.degree}
                </p>
                <div className="flex gap-2 items-center mt-1">
                  <Badge className={`${categoryColors[app.category]} text-white`}>
                    {app.category}
                  </Badge>
                  <a
                    href={app.college_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {app.college_url}
                  </a>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(app.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
