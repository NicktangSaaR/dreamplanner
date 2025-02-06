
import React from 'react';
import { Button } from "@/components/ui/button";
import { FormattingToolbarProps } from './types';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image,
  Video,
  Type,
  Palette
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const colors = [
  { name: 'Black', value: '#000000' },
  { name: 'Dark Gray', value: '#666666' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#008000' },
  { name: 'Purple', value: '#800080' },
];

export default function FormattingToolbar({ onExecCommand }: FormattingToolbarProps) {
  const handleLinkClick = () => {
    const url = prompt('Enter URL:');
    if (url) {
      onExecCommand('createLink', url);
    }
  };

  const handleImageClick = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      onExecCommand('insertImage', url);
    }
  };

  const handleVideoClick = () => {
    const url = prompt('Enter video embed URL:');
    if (url) {
      const embedCode = `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>`;
      onExecCommand('insertHTML', embedCode);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onExecCommand('bold')}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('italic')}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('underline')}>
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('justifyLeft')}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('justifyCenter')}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={() => onExecCommand('justifyRight')}>
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <Select onValueChange={(value) => onExecCommand('fontSize', value)}>
          <SelectTrigger className="w-[100px]">
            <Type className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-6 gap-2">
              {colors.map((color) => (
                <Button
                  key={color.value}
                  className="w-8 h-8 rounded-full p-0"
                  style={{ backgroundColor: color.value }}
                  onClick={() => onExecCommand('foreColor', color.value)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button type="button" variant="outline" onClick={handleLinkClick}>
          <Link2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={handleImageClick}>
          <Image className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" onClick={handleVideoClick}>
          <Video className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
