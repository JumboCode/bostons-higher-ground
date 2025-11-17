"use client" 

import React from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const schoolOptions = [
  { value: 'dearborn', label: 'Dearborn' },
  { value: 'south_end', label: 'South End' },
  { value: 'boston_latin', label: 'Boston Latin' },
  
];

const gradeOptions = [
  { value: 'all_grades', label: 'All Grades' },
  { value: 'k-5', label: 'K-5' },
  { value: '6-8', label: '6-8' },
  { value: '9-12', label: '9-12' },
];

const genderOptions = [
  { value: 'all_genders', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const housingStatusOptions = [
  { value: 'all_statuses', label: 'All Statuses' },
  { value: 'housed', label: 'Housed' },
  { value: 'not_housed', label: 'Not Housed' },
];


export default function SchoolFilterBar() {


  const renderFilter = (label: string, placeholder: string, options: { value: string, label: string }[]) => (
    <div className="flex flex-col space-y-2 w-full max-w-[200px]">
      <Label className="text-gray-700 font-semibold">{label}</Label>
      <Select defaultValue={options[0].value}>
        <SelectTrigger className="w-full">
          {}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (

    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mx-8">
      
      <div className="flex space-x-6">
        
        {renderFilter("Select School", "Select a School", schoolOptions)}
        
        {renderFilter("Grade Level", "Select Grade", gradeOptions)}
        
        {renderFilter("Gender", "Select Gender", genderOptions)}
        
        {renderFilter("Housing Status", "Select Status", housingStatusOptions)}

      </div>
    </div>
  );
}