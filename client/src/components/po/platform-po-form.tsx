import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Check, CalendarDays, Package, MapPin, Building2, User, FileText, Warehouse, Truck, Save, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LineItemRow } from "./line-item-row";
import { SeedButton } from "@/components/seed-button";
import { useLocation } from "wouter";
import type { PfMst, DistributorMst, InsertPfOrderItems } from "@shared/schema";

const poFormSchema = z.object({
  company: z.string().min(1, "Company selection is required"),
  po_number: z.string().min(1, "PO number is required"),
  platform: z.number().refine(val => val > 0, "Platform selection is required"),
  status: z.string().min(1, "Status is required"),
  order_date: z.string().min(1, "Order date is required"),
  expiry_date: z.string().optional(),
  appointment_date: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  serving_distributor: z.string().optional(),
  dispatch_from: z.string().optional(),
  warehouse: z.string().optional(),
  attachment: z.string().optional()
});

type POFormData = z.infer<typeof poFormSchema>;

interface LineItem extends InsertPfOrderItems {
  tempId: string;
  po_id?: number;
}

const companyOptions = [
  { value: "Jivo Mart", label: "Jivo Mart" },
  { value: "Jivo Wellness", label: "Jivo Wellness" }
];

const statusOptions = [
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Expired", label: "Expired" },
  { value: "Duplicate", label: "Duplicate" }
];

const dispatchFromOptions = [
  { value: "MAYAPURI", label: "MAYAPURI" },
  { value: "BHAKHAPUR", label: "BHAKHAPUR" }
];

const regionStateData = {
  "North India": {
    states: [
      { value: "Punjab", label: "Punjab" },
      { value: "Haryana", label: "Haryana" },
      { value: "Delhi", label: "Delhi" },
      { value: "Uttar Pradesh", label: "Uttar Pradesh" },
      { value: "Himachal Pradesh", label: "Himachal Pradesh" },
      { value: "Uttarakhand", label: "Uttarakhand" },
      { value: "Jammu & Kashmir", label: "Jammu & Kashmir" },
      { value: "Ladakh", label: "Ladakh" },
      { value: "Rajasthan", label: "Rajasthan" },
      { value: "Chandigarh", label: "Chandigarh" }
    ]
  },
  "South India": {
    states: [
      { value: "Karnataka", label: "Karnataka" },
      { value: "Tamil Nadu", label: "Tamil Nadu" },
      { value: "Kerala", label: "Kerala" },
      { value: "Andhra Pradesh", label: "Andhra Pradesh" },
      { value: "Telangana", label: "Telangana" },
      { value: "Puducherry", label: "Puducherry" },
      { value: "Lakshadweep", label: "Lakshadweep" }
    ]
  },
  "East India": {
    states: [
      { value: "West Bengal", label: "West Bengal" },
      { value: "Odisha", label: "Odisha" },
      { value: "Bihar", label: "Bihar" },
      { value: "Jharkhand", label: "Jharkhand" },
      { value: "Assam", label: "Assam" },
      { value: "Sikkim", label: "Sikkim" },
      { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
      { value: "Meghalaya", label: "Meghalaya" },
      { value: "Manipur", label: "Manipur" },
      { value: "Mizoram", label: "Mizoram" },
      { value: "Nagaland", label: "Nagaland" },
      { value: "Tripura", label: "Tripura" }
    ]
  },
  "West India": {
    states: [
      { value: "Maharashtra", label: "Maharashtra" },
      { value: "Gujarat", label: "Gujarat" },
      { value: "Goa", label: "Goa" },
      { value: "Madhya Pradesh", label: "Madhya Pradesh" },
      { value: "Chhattisgarh", label: "Chhattisgarh" },
      { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra and Nagar Haveli and Daman and Diu" }
    ]
  }
};

const stateCityData: Record<string, { value: string; label: string }[]> = {
  // North India
  "Punjab": [
    { value: "Ludhiana", label: "Ludhiana" },
    { value: "Amritsar", label: "Amritsar" },
    { value: "Jalandhar", label: "Jalandhar" },
    { value: "Patiala", label: "Patiala" },
    { value: "Bathinda", label: "Bathinda" },
    { value: "Mohali", label: "Mohali" },
    { value: "Pathankot", label: "Pathankot" },
    { value: "Hoshiarpur", label: "Hoshiarpur" },
    { value: "Batala", label: "Batala" },
    { value: "Moga", label: "Moga" }
  ],
  "Haryana": [
    { value: "Gurgaon", label: "Gurgaon" },
    { value: "Faridabad", label: "Faridabad" },
    { value: "Panipat", label: "Panipat" },
    { value: "Ambala", label: "Ambala" },
    { value: "Yamunanagar", label: "Yamunanagar" },
    { value: "Rohtak", label: "Rohtak" },
    { value: "Hisar", label: "Hisar" },
    { value: "Karnal", label: "Karnal" },
    { value: "Sonipat", label: "Sonipat" },
    { value: "Kurukshetra", label: "Kurukshetra" }
  ],
  "Delhi": [
    { value: "New Delhi", label: "New Delhi" },
    { value: "North Delhi", label: "North Delhi" },
    { value: "South Delhi", label: "South Delhi" },
    { value: "East Delhi", label: "East Delhi" },
    { value: "West Delhi", label: "West Delhi" },
    { value: "Central Delhi", label: "Central Delhi" },
    { value: "North East Delhi", label: "North East Delhi" },
    { value: "North West Delhi", label: "North West Delhi" },
    { value: "South East Delhi", label: "South East Delhi" },
    { value: "South West Delhi", label: "South West Delhi" },
    { value: "Shahdara", label: "Shahdara" }
  ],
  "Uttar Pradesh": [
    { value: "Lucknow", label: "Lucknow" },
    { value: "Kanpur", label: "Kanpur" },
    { value: "Ghaziabad", label: "Ghaziabad" },
    { value: "Agra", label: "Agra" },
    { value: "Varanasi", label: "Varanasi" },
    { value: "Meerut", label: "Meerut" },
    { value: "Allahabad", label: "Allahabad" },
    { value: "Bareilly", label: "Bareilly" },
    { value: "Aligarh", label: "Aligarh" },
    { value: "Moradabad", label: "Moradabad" },
    { value: "Saharanpur", label: "Saharanpur" },
    { value: "Gorakhpur", label: "Gorakhpur" },
    { value: "Noida", label: "Noida" },
    { value: "Firozabad", label: "Firozabad" },
    { value: "Jhansi", label: "Jhansi" }
  ],
  "Himachal Pradesh": [
    { value: "Shimla", label: "Shimla" },
    { value: "Manali", label: "Manali" },
    { value: "Dharamshala", label: "Dharamshala" },
    { value: "Solan", label: "Solan" },
    { value: "Mandi", label: "Mandi" },
    { value: "Kullu", label: "Kullu" },
    { value: "Hamirpur", label: "Hamirpur" },
    { value: "Bilaspur", label: "Bilaspur" },
    { value: "Una", label: "Una" },
    { value: "Chamba", label: "Chamba" }
  ],
  "Uttarakhand": [
    { value: "Dehradun", label: "Dehradun" },
    { value: "Haridwar", label: "Haridwar" },
    { value: "Roorkee", label: "Roorkee" },
    { value: "Haldwani", label: "Haldwani" },
    { value: "Rishikesh", label: "Rishikesh" },
    { value: "Kashipur", label: "Kashipur" },
    { value: "Rudrapur", label: "Rudrapur" },
    { value: "Nainital", label: "Nainital" },
    { value: "Almora", label: "Almora" },
    { value: "Mussoorie", label: "Mussoorie" }
  ],
  "Jammu & Kashmir": [
    { value: "Srinagar", label: "Srinagar" },
    { value: "Jammu", label: "Jammu" },
    { value: "Anantnag", label: "Anantnag" },
    { value: "Baramulla", label: "Baramulla" },
    { value: "Sopore", label: "Sopore" },
    { value: "Kathua", label: "Kathua" },
    { value: "Udhampur", label: "Udhampur" },
    { value: "Punch", label: "Punch" },
    { value: "Rajouri", label: "Rajouri" },
    { value: "Kupwara", label: "Kupwara" }
  ],
  "Ladakh": [
    { value: "Leh", label: "Leh" },
    { value: "Kargil", label: "Kargil" },
    { value: "Nubra", label: "Nubra" },
    { value: "Zanskar", label: "Zanskar" }
  ],
  "Rajasthan": [
    { value: "Jaipur", label: "Jaipur" },
    { value: "Jodhpur", label: "Jodhpur" },
    { value: "Udaipur", label: "Udaipur" },
    { value: "Kota", label: "Kota" },
    { value: "Bikaner", label: "Bikaner" },
    { value: "Ajmer", label: "Ajmer" },
    { value: "Bhilwara", label: "Bhilwara" },
    { value: "Alwar", label: "Alwar" },
    { value: "Bharatpur", label: "Bharatpur" },
    { value: "Sikar", label: "Sikar" },
    { value: "Pali", label: "Pali" },
    { value: "Tonk", label: "Tonk" },
    { value: "Kishangarh", label: "Kishangarh" },
    { value: "Beawar", label: "Beawar" },
    { value: "Hanumangarh", label: "Hanumangarh" }
  ],
  "Chandigarh": [
    { value: "Chandigarh", label: "Chandigarh" }
  ],

  // South India
  "Karnataka": [
    { value: "Bangalore", label: "Bangalore" },
    { value: "Mysore", label: "Mysore" },
    { value: "Hubli", label: "Hubli-Dharwad" },
    { value: "Mangalore", label: "Mangalore" },
    { value: "Belgaum", label: "Belgaum" },
    { value: "Gulbarga", label: "Gulbarga" },
    { value: "Davanagere", label: "Davanagere" },
    { value: "Bellary", label: "Bellary" },
    { value: "Bijapur", label: "Bijapur" },
    { value: "Shimoga", label: "Shimoga" },
    { value: "Tumkur", label: "Tumkur" },
    { value: "Raichur", label: "Raichur" },
    { value: "Bidar", label: "Bidar" },
    { value: "Hospet", label: "Hospet" },
    { value: "Hassan", label: "Hassan" }
  ],
  "Tamil Nadu": [
    { value: "Chennai", label: "Chennai" },
    { value: "Coimbatore", label: "Coimbatore" },
    { value: "Madurai", label: "Madurai" },
    { value: "Tiruchirappalli", label: "Tiruchirappalli" },
    { value: "Salem", label: "Salem" },
    { value: "Tirunelveli", label: "Tirunelveli" },
    { value: "Tirupur", label: "Tirupur" },
    { value: "Vellore", label: "Vellore" },
    { value: "Thoothukudi", label: "Thoothukudi" },
    { value: "Dindigul", label: "Dindigul" },
    { value: "Thanjavur", label: "Thanjavur" },
    { value: "Ranipet", label: "Ranipet" },
    { value: "Sivakasi", label: "Sivakasi" },
    { value: "Karur", label: "Karur" },
    { value: "Udhagamandalam", label: "Udhagamandalam" }
  ],
  "Kerala": [
    { value: "Thiruvananthapuram", label: "Thiruvananthapuram" },
    { value: "Kochi", label: "Kochi" },
    { value: "Kozhikode", label: "Kozhikode" },
    { value: "Thrissur", label: "Thrissur" },
    { value: "Kollam", label: "Kollam" },
    { value: "Palakkad", label: "Palakkad" },
    { value: "Alappuzha", label: "Alappuzha" },
    { value: "Malappuram", label: "Malappuram" },
    { value: "Kannur", label: "Kannur" },
    { value: "Kasaragod", label: "Kasaragod" },
    { value: "Kottayam", label: "Kottayam" },
    { value: "Pathanamthitta", label: "Pathanamthitta" },
    { value: "Idukki", label: "Idukki" },
    { value: "Wayanad", label: "Wayanad" }
  ],
  "Andhra Pradesh": [
    { value: "Visakhapatnam", label: "Visakhapatnam" },
    { value: "Vijayawada", label: "Vijayawada" },
    { value: "Guntur", label: "Guntur" },
    { value: "Nellore", label: "Nellore" },
    { value: "Kurnool", label: "Kurnool" },
    { value: "Rajahmundry", label: "Rajahmundry" },
    { value: "Tirupati", label: "Tirupati" },
    { value: "Kadapa", label: "Kadapa" },
    { value: "Anantapur", label: "Anantapur" },
    { value: "Eluru", label: "Eluru" },
    { value: "Ongole", label: "Ongole" },
    { value: "Nandyal", label: "Nandyal" },
    { value: "Machilipatnam", label: "Machilipatnam" },
    { value: "Tenali", label: "Tenali" },
    { value: "Chittoor", label: "Chittoor" }
  ],
  "Telangana": [
    { value: "Hyderabad", label: "Hyderabad" },
    { value: "Warangal", label: "Warangal" },
    { value: "Nizamabad", label: "Nizamabad" },
    { value: "Khammam", label: "Khammam" },
    { value: "Karimnagar", label: "Karimnagar" },
    { value: "Ramagundam", label: "Ramagundam" },
    { value: "Mahbubnagar", label: "Mahbubnagar" },
    { value: "Nalgonda", label: "Nalgonda" },
    { value: "Adilabad", label: "Adilabad" },
    { value: "Suryapet", label: "Suryapet" },
    { value: "Miryalaguda", label: "Miryalaguda" },
    { value: "Jagtial", label: "Jagtial" },
    { value: "Mancherial", label: "Mancherial" },
    { value: "Kamareddy", label: "Kamareddy" },
    { value: "Siddipet", label: "Siddipet" }
  ],
  "Puducherry": [
    { value: "Puducherry", label: "Puducherry" },
    { value: "Karaikal", label: "Karaikal" },
    { value: "Mahe", label: "Mahe" },
    { value: "Yanam", label: "Yanam" }
  ],
  "Lakshadweep": [
    { value: "Kavaratti", label: "Kavaratti" },
    { value: "Agatti", label: "Agatti" },
    { value: "Minicoy", label: "Minicoy" }
  ],

  // East India
  "West Bengal": [
    { value: "Kolkata", label: "Kolkata" },
    { value: "Howrah", label: "Howrah" },
    { value: "Durgapur", label: "Durgapur" },
    { value: "Asansol", label: "Asansol" },
    { value: "Siliguri", label: "Siliguri" },
    { value: "Malda", label: "Malda" },
    { value: "Bardhaman", label: "Bardhaman" },
    { value: "Baharampur", label: "Baharampur" },
    { value: "Habra", label: "Habra" },
    { value: "Kharagpur", label: "Kharagpur" },
    { value: "Shantipur", label: "Shantipur" },
    { value: "Dankuni", label: "Dankuni" },
    { value: "Dhulian", label: "Dhulian" },
    { value: "Ranaghat", label: "Ranaghat" },
    { value: "Haldia", label: "Haldia" }
  ],
  "Odisha": [
    { value: "Bhubaneswar", label: "Bhubaneswar" },
    { value: "Cuttack", label: "Cuttack" },
    { value: "Rourkela", label: "Rourkela" },
    { value: "Berhampur", label: "Berhampur" },
    { value: "Sambalpur", label: "Sambalpur" },
    { value: "Puri", label: "Puri" },
    { value: "Balasore", label: "Balasore" },
    { value: "Bhadrak", label: "Bhadrak" },
    { value: "Baripada", label: "Baripada" },
    { value: "Jharsuguda", label: "Jharsuguda" },
    { value: "Jeypore", label: "Jeypore" },
    { value: "Talcher", label: "Talcher" },
    { value: "Kendujhar", label: "Kendujhar" },
    { value: "Sunabeda", label: "Sunabeda" },
    { value: "Rayagada", label: "Rayagada" }
  ],
  "Bihar": [
    { value: "Patna", label: "Patna" },
    { value: "Gaya", label: "Gaya" },
    { value: "Bhagalpur", label: "Bhagalpur" },
    { value: "Muzaffarpur", label: "Muzaffarpur" },
    { value: "Darbhanga", label: "Darbhanga" },
    { value: "Bihar Sharif", label: "Bihar Sharif" },
    { value: "Arrah", label: "Arrah" },
    { value: "Begusarai", label: "Begusarai" },
    { value: "Katihar", label: "Katihar" },
    { value: "Munger", label: "Munger" },
    { value: "Chhapra", label: "Chhapra" },
    { value: "Danapur", label: "Danapur" },
    { value: "Saharsa", label: "Saharsa" },
    { value: "Hajipur", label: "Hajipur" },
    { value: "Sasaram", label: "Sasaram" }
  ],
  "Jharkhand": [
    { value: "Ranchi", label: "Ranchi" },
    { value: "Jamshedpur", label: "Jamshedpur" },
    { value: "Dhanbad", label: "Dhanbad" },
    { value: "Bokaro", label: "Bokaro Steel City" },
    { value: "Deoghar", label: "Deoghar" },
    { value: "Phusro", label: "Phusro" },
    { value: "Hazaribagh", label: "Hazaribagh" },
    { value: "Giridih", label: "Giridih" },
    { value: "Ramgarh", label: "Ramgarh" },
    { value: "Medininagar", label: "Medininagar" },
    { value: "Chirkunda", label: "Chirkunda" },
    { value: "Pakaur", label: "Pakaur" },
    { value: "Chaibasa", label: "Chaibasa" },
    { value: "Dumka", label: "Dumka" },
    { value: "Madhupur", label: "Madhupur" }
  ],
  "Assam": [
    { value: "Guwahati", label: "Guwahati" },
    { value: "Silchar", label: "Silchar" },
    { value: "Dibrugarh", label: "Dibrugarh" },
    { value: "Nagaon", label: "Nagaon" },
    { value: "Tinsukia", label: "Tinsukia" },
    { value: "Jorhat", label: "Jorhat" },
    { value: "Bongaigaon", label: "Bongaigaon" },
    { value: "Dhubri", label: "Dhubri" },
    { value: "Diphu", label: "Diphu" },
    { value: "North Lakhimpur", label: "North Lakhimpur" },
    { value: "Tezpur", label: "Tezpur" },
    { value: "Karimganj", label: "Karimganj" },
    { value: "Sibsagar", label: "Sibsagar" },
    { value: "Goalpara", label: "Goalpara" },
    { value: "Barpeta", label: "Barpeta" }
  ],
  "Sikkim": [
    { value: "Gangtok", label: "Gangtok" },
    { value: "Namchi", label: "Namchi" },
    { value: "Geyzing", label: "Geyzing" },
    { value: "Mangan", label: "Mangan" }
  ],
  "Arunachal Pradesh": [
    { value: "Itanagar", label: "Itanagar" },
    { value: "Naharlagun", label: "Naharlagun" },
    { value: "Pasighat", label: "Pasighat" },
    { value: "Tezpur", label: "Tezpur" },
    { value: "Bomdila", label: "Bomdila" },
    { value: "Along", label: "Along" },
    { value: "Ziro", label: "Ziro" },
    { value: "Seppa", label: "Seppa" },
    { value: "Tezu", label: "Tezu" },
    { value: "Khonsa", label: "Khonsa" }
  ],
  "Meghalaya": [
    { value: "Shillong", label: "Shillong" },
    { value: "Tura", label: "Tura" },
    { value: "Nongpoh", label: "Nongpoh" },
    { value: "Jowai", label: "Jowai" },
    { value: "Baghmara", label: "Baghmara" },
    { value: "Williamnagar", label: "Williamnagar" },
    { value: "Nongstoin", label: "Nongstoin" },
    { value: "Mawkyrwat", label: "Mawkyrwat" },
    { value: "Resubelpara", label: "Resubelpara" },
    { value: "Ampati", label: "Ampati" }
  ],
  "Manipur": [
    { value: "Imphal", label: "Imphal" },
    { value: "Thoubal", label: "Thoubal" },
    { value: "Lilong", label: "Lilong" },
    { value: "Mayang Imphal", label: "Mayang Imphal" },
    { value: "Kakching", label: "Kakching" },
    { value: "Bishnupur", label: "Bishnupur" },
    { value: "Churachandpur", label: "Churachandpur" },
    { value: "Senapati", label: "Senapati" },
    { value: "Ukhrul", label: "Ukhrul" },
    { value: "Tamenglong", label: "Tamenglong" }
  ],
  "Mizoram": [
    { value: "Aizawl", label: "Aizawl" },
    { value: "Lunglei", label: "Lunglei" },
    { value: "Saiha", label: "Saiha" },
    { value: "Champhai", label: "Champhai" },
    { value: "Kolasib", label: "Kolasib" },
    { value: "Lawngtlai", label: "Lawngtlai" },
    { value: "Mamit", label: "Mamit" },
    { value: "Serchhip", label: "Serchhip" }
  ],
  "Nagaland": [
    { value: "Kohima", label: "Kohima" },
    { value: "Dimapur", label: "Dimapur" },
    { value: "Mokokchung", label: "Mokokchung" },
    { value: "Tuensang", label: "Tuensang" },
    { value: "Wokha", label: "Wokha" },
    { value: "Zunheboto", label: "Zunheboto" },
    { value: "Phek", label: "Phek" },
    { value: "Kiphire", label: "Kiphire" },
    { value: "Longleng", label: "Longleng" },
    { value: "Peren", label: "Peren" },
    { value: "Mon", label: "Mon" }
  ],
  "Tripura": [
    { value: "Agartala", label: "Agartala" },
    { value: "Dharmanagar", label: "Dharmanagar" },
    { value: "Udaipur", label: "Udaipur" },
    { value: "Kailashahar", label: "Kailashahar" },
    { value: "Belonia", label: "Belonia" },
    { value: "Khowai", label: "Khowai" },
    { value: "Ambassa", label: "Ambassa" },
    { value: "Ranir Bazar", label: "Ranir Bazar" }
  ],

  // West India
  "Maharashtra": [
    { value: "Mumbai", label: "Mumbai" },
    { value: "Pune", label: "Pune" },
    { value: "Nagpur", label: "Nagpur" },
    { value: "Thane", label: "Thane" },
    { value: "Nashik", label: "Nashik" },
    { value: "Aurangabad", label: "Aurangabad" },
    { value: "Solapur", label: "Solapur" },
    { value: "Amravati", label: "Amravati" },
    { value: "Nanded", label: "Nanded" },
    { value: "Kolhapur", label: "Kolhapur" },
    { value: "Sangli", label: "Sangli" },
    { value: "Jalgaon", label: "Jalgaon" },
    { value: "Akola", label: "Akola" },
    { value: "Latur", label: "Latur" },
    { value: "Dhule", label: "Dhule" },
    { value: "Ahmednagar", label: "Ahmednagar" },
    { value: "Chandrapur", label: "Chandrapur" },
    { value: "Parbhani", label: "Parbhani" },
    { value: "Ichalkaranji", label: "Ichalkaranji" },
    { value: "Jalna", label: "Jalna" }
  ],
  "Gujarat": [
    { value: "Ahmedabad", label: "Ahmedabad" },
    { value: "Surat", label: "Surat" },
    { value: "Vadodara", label: "Vadodara" },
    { value: "Rajkot", label: "Rajkot" },
    { value: "Bhavnagar", label: "Bhavnagar" },
    { value: "Jamnagar", label: "Jamnagar" },
    { value: "Junagadh", label: "Junagadh" },
    { value: "Gandhinagar", label: "Gandhinagar" },
    { value: "Anand", label: "Anand" },
    { value: "Navsari", label: "Navsari" },
    { value: "Morbi", label: "Morbi" },
    { value: "Mehsana", label: "Mehsana" },
    { value: "Bharuch", label: "Bharuch" },
    { value: "Vapi", label: "Vapi" },
    { value: "Veraval", label: "Veraval" },
    { value: "Porbandar", label: "Porbandar" },
    { value: "Godhra", label: "Godhra" },
    { value: "Bhuj", label: "Bhuj" },
    { value: "Surendranagar", label: "Surendranagar" },
    { value: "Gandhidham", label: "Gandhidham" }
  ],
  "Goa": [
    { value: "Panaji", label: "Panaji" },
    { value: "Vasco da Gama", label: "Vasco da Gama" },
    { value: "Margao", label: "Margao" },
    { value: "Mapusa", label: "Mapusa" },
    { value: "Ponda", label: "Ponda" },
    { value: "Bicholim", label: "Bicholim" },
    { value: "Curchorem", label: "Curchorem" },
    { value: "Sanquelim", label: "Sanquelim" }
  ],
  "Madhya Pradesh": [
    { value: "Bhopal", label: "Bhopal" },
    { value: "Indore", label: "Indore" },
    { value: "Gwalior", label: "Gwalior" },
    { value: "Jabalpur", label: "Jabalpur" },
    { value: "Ujjain", label: "Ujjain" },
    { value: "Sagar", label: "Sagar" },
    { value: "Dewas", label: "Dewas" },
    { value: "Satna", label: "Satna" },
    { value: "Ratlam", label: "Ratlam" },
    { value: "Rewa", label: "Rewa" },
    { value: "Sehore", label: "Sehore" },
    { value: "Morena", label: "Morena" },
    { value: "Singrauli", label: "Singrauli" },
    { value: "Burhanpur", label: "Burhanpur" },
    { value: "Khandwa", label: "Khandwa" },
    { value: "Bhind", label: "Bhind" },
    { value: "Chhindwara", label: "Chhindwara" },
    { value: "Guna", label: "Guna" },
    { value: "Shivpuri", label: "Shivpuri" },
    { value: "Vidisha", label: "Vidisha" }
  ],
  "Chhattisgarh": [
    { value: "Raipur", label: "Raipur" },
    { value: "Bhilai", label: "Bhilai" },
    { value: "Bilaspur", label: "Bilaspur" },
    { value: "Korba", label: "Korba" },
    { value: "Durg", label: "Durg" },
    { value: "Rajnandgaon", label: "Rajnandgaon" },
    { value: "Jagdalpur", label: "Jagdalpur" },
    { value: "Raigarh", label: "Raigarh" },
    { value: "Ambikapur", label: "Ambikapur" },
    { value: "Mahasamund", label: "Mahasamund" },
    { value: "Dhamtari", label: "Dhamtari" },
    { value: "Chirmiri", label: "Chirmiri" },
    { value: "Bhatapara", label: "Bhatapara" },
    { value: "Dalli-Rajhara", label: "Dalli-Rajhara" },
    { value: "Naila Janjgir", label: "Naila Janjgir" }
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    { value: "Daman", label: "Daman" },
    { value: "Diu", label: "Diu" },
    { value: "Silvassa", label: "Silvassa" }
  ]
};

const regionOptions = Object.keys(regionStateData).map(region => ({
  value: region,
  label: region
}));

// Static distributor list to ensure all distributors are available
const staticDistributors = [
  { id: 1, distributor_name: "DISTRIBUTOR A" },
  { id: 2, distributor_name: "DISTRIBUTOR B" },
  { id: 3, distributor_name: "RK WORLD" },
  { id: 4, distributor_name: "EVARA" },
  { id: 5, distributor_name: "SUSTAINABLE" },
  { id: 6, distributor_name: "BABA LOKNATH" },
  { id: 7, distributor_name: "KNOWTABLE" },
  { id: 8, distributor_name: "CHIRAG" }
];

export function PlatformPOForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [availableStates, setAvailableStates] = useState<{ value: string; label: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<{ value: string; label: string }[]>([]);
  const [filteredDistributors, setFilteredDistributors] = useState<DistributorMst[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Helper function to get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const form = useForm<POFormData>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      company: "",
      po_number: "",
      platform: 0,
      status: "Open",
      order_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      appointment_date: "",
      region: "",
      state: "",
      city: "",
      area: "",
      serving_distributor: "none",
      dispatch_from: "",
      warehouse: "",
      attachment: ""
    }
  });

  // Fetch platforms
  const { data: platforms = [] } = useQuery<PfMst[]>({
    queryKey: ["/api/platforms"]
  });

  // Fetch distributors from API and combine with static list
  const { data: apiDistributors = [] } = useQuery<DistributorMst[]>({
    queryKey: ["/api/distributors"]
  });

  // Combine API distributors with static distributors (API takes priority)
  const distributors = [...apiDistributors];
  
  // Add static distributors that are not already in API response
  staticDistributors.forEach(staticDist => {
    const exists = distributors.find(d => 
      d.distributor_name.toLowerCase() === staticDist.distributor_name.toLowerCase()
    );
    if (!exists) {
      distributors.push(staticDist as DistributorMst);
    }
  });

  // Get current platform selection
  const selectedPlatform = form.watch("platform");
  const selectedCompany = form.watch("company");
  const selectedRegion = form.watch("region");
  const selectedState = form.watch("state");

  // Filter platforms based on selected company
  const filteredPlatforms = useMemo(() => {
    if (!selectedCompany || platforms.length === 0) return platforms;
    
    // Define platform-to-company mapping
    const platformCompanyMap: Record<string, string[]> = {
      "Jivo Mart": ["Amazon", "Flipkart", "BigBasket", "JioMart", "Swiggy", "Instamart"],
      "Jivo Wellness": ["Blinkit", "Zepto", "Dunzo", "1mg", "Pharmeasy", "Wellness"]
    };
    
    const companyPlatforms = platformCompanyMap[selectedCompany] || [];
    return platforms.filter(platform => 
      companyPlatforms.some(platName => 
        platform.pf_name.toLowerCase().includes(platName.toLowerCase())
      )
    );
  }, [selectedCompany, platforms]);

  // Effect to reset platform when company changes
  useEffect(() => {
    if (selectedCompany && selectedPlatform && selectedPlatform !== 0) {
      // Check if current platform is valid for the selected company
      const isCurrentPlatformValid = filteredPlatforms.some(p => p.id === selectedPlatform);
      if (!isCurrentPlatformValid) {
        form.setValue("platform", 0);
      }
    }
  }, [selectedCompany, selectedPlatform, filteredPlatforms, form]);

  // Effect to update states when region changes
  useEffect(() => {
    if (selectedRegion && regionStateData[selectedRegion as keyof typeof regionStateData]) {
      const newStates = regionStateData[selectedRegion as keyof typeof regionStateData].states;
      setAvailableStates(newStates);
      
      // Clear state and city when region changes
      const currentState = form.getValues("state");
      const currentCity = form.getValues("city");
      
      if (currentState || currentCity) {
        form.setValue("state", "", { shouldValidate: true });
        form.setValue("city", "", { shouldValidate: true });
        setAvailableCities([]);
      }
    } else if (selectedRegion === "") {
      setAvailableStates([]);
      setAvailableCities([]);
      form.setValue("state", "", { shouldValidate: true });
      form.setValue("city", "", { shouldValidate: true });
    }
  }, [selectedRegion, form]);

  // Effect to update cities when state changes
  useEffect(() => {
    if (selectedState && stateCityData[selectedState]) {
      const newCities = stateCityData[selectedState];
      setAvailableCities(newCities);
      
      // Clear city when state changes
      const currentCity = form.getValues("city");
      if (currentCity) {
        form.setValue("city", "", { shouldValidate: true });
      }
    } else if (selectedState === "") {
      setAvailableCities([]);
      form.setValue("city", "", { shouldValidate: true });
    }
  }, [selectedState, form]);

  // Effect to filter distributors based on platform (Amazon -> RK WORLD only)
  useEffect(() => {
    const platform = filteredPlatforms.find(p => p.id === selectedPlatform);
    
    if (platform?.pf_name?.toLowerCase().includes('amazon')) {
      // For Amazon platform, only show RK WORLD distributor
      const rkWorldDistributor = distributors.filter(d => 
        d.distributor_name.toUpperCase() === 'RK WORLD'
      );
      setFilteredDistributors(rkWorldDistributor);
      
      // Automatically select RK WORLD if found
      const rkWorld = distributors.find(d => 
        d.distributor_name.toUpperCase() === 'RK WORLD'
      );
      if (rkWorld) {
        form.setValue("serving_distributor", rkWorld.distributor_name);
      }
    } else {
      // For other platforms, show all distributors except RK WORLD
      const otherDistributors = distributors.filter(d => 
        d.distributor_name.toUpperCase() !== 'RK WORLD'
      );
      setFilteredDistributors(otherDistributors);
    }
  }, [selectedPlatform, platforms, distributors, form]);

  // Track previous platform to detect actual changes
  const previousPlatformRef = useRef<number | null>(null);

  // Effect to reset form when platform changes
  useEffect(() => {
    if (selectedPlatform && selectedPlatform !== 0) {
      // Only reset if platform actually changed (not on initial load)
      if (previousPlatformRef.current !== null && previousPlatformRef.current !== selectedPlatform) {
        const platform = filteredPlatforms.find(p => p.id === selectedPlatform);
        
        // Determine initial distributor value based on platform
        let initialDistributor = "none";
        if (platform?.pf_name?.toLowerCase().includes('amazon')) {
          const rkWorld = distributors.find(d => 
            d.distributor_name.toUpperCase() === 'RK WORLD'
          );
          if (rkWorld) {
            initialDistributor = rkWorld.distributor_name;
          }
        }
        
        form.reset({
          company: form.getValues("company"), // Preserve company selection
          po_number: "",
          platform: selectedPlatform,
          status: "Open",
          order_date: new Date().toISOString().split('T')[0],
          expiry_date: "",
          appointment_date: "",
          region: "",
          state: "",
          city: "",
          area: "",
          serving_distributor: initialDistributor,
          dispatch_from: "",
          warehouse: "",
          attachment: ""
        });
        
        setLineItems([]);
        setSelectedFile(null); // Reset selected file when platform changes
      }
      
      // Update previous platform
      previousPlatformRef.current = selectedPlatform;
    }
  }, [selectedPlatform, filteredPlatforms, distributors, form]);

  // Create PO mutation
  const createPoMutation = useMutation({
    mutationFn: async (data: { po: POFormData; items: InsertPfOrderItems[] }) => {
      const response = await apiRequest("POST", "/api/pos", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase order created successfully!"
      });
      
      // Get the selected platform details
      const selectedPlatformId = form.getValues("platform");
      const selectedPlatformDetails = platforms?.find(p => p.id === selectedPlatformId);
      
      // Navigate to the appropriate view page based on platform
      if (selectedPlatformDetails) {
        const platformName = selectedPlatformDetails.pf_name.toLowerCase();
        
        // Map platform names to their respective routes
        if (platformName === "blinkit") {
          setLocation("/blinkit-pos");
        } else if (platformName === "zepto") {
          setLocation("/zepto-pos");
        } else if (platformName === "city mall" || platformName === "citymall") {
          setLocation("/city-mall-pos");
        } else if (platformName.includes("flipkart")) {
          setLocation("/flipkart-grocery-pos");
        } else {
          // Default to platform-po for other platforms
          setLocation("/platform-po");
        }
      } else {
        // Fallback to platform-po if platform not found
        setLocation("/platform-po");
      }
      
      // Reset form and invalidate queries
      form.reset();
      setLineItems([]);
      queryClient.invalidateQueries({ queryKey: ["/api/pos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive"
      });
    }
  });

  const addLineItem = () => {
    const newItem: LineItem = {
      tempId: `temp-${Date.now()}`,
      po_id: 0,
      item_name: "",
      quantity: 0,
      sap_code: "",
      category: "",
      subcategory: "",
      basic_rate: "0",
      gst_rate: "0",
      landing_rate: "0",
      status: "Pending"
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (tempId: string, updates: Partial<LineItem>) => {
    setLineItems(items => 
      items.map(item => 
        item.tempId === tempId ? { ...item, ...updates } : item
      )
    );
  };

  const removeLineItem = (tempId: string) => {
    setLineItems(items => items.filter(item => item.tempId !== tempId));
  };

  // Memoized calculations for better performance
  const calculatedTotals = useMemo(() => {
    return lineItems.reduce((totals, item) => {
      const basicRate = parseFloat(item.basic_rate || "0");
      const quantity = item.quantity || 0;
      const gstRate = parseFloat(item.gst_rate || "0");
      
      const basicTotal = basicRate * quantity;
      const gstTotal = (basicTotal * gstRate) / 100;
      const landingTotal = basicTotal + gstTotal;
      
      return {
        totalQuantity: totals.totalQuantity + quantity,
        totalBasicAmount: totals.totalBasicAmount + basicTotal,
        totalGstAmount: totals.totalGstAmount + gstTotal,
        totalValue: totals.totalValue + landingTotal
      };
    }, {
      totalQuantity: 0,
      totalBasicAmount: 0,
      totalGstAmount: 0,
      totalValue: 0
    });
  }, [lineItems]);

  // Auto-save functionality
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirty) {
        const formData = form.getValues();
        const draftData = {
          formData,
          lineItems,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('po_draft', JSON.stringify(draftData));
        setLastSaved(new Date());
        setIsDirty(false);
        
        toast({
          title: "Draft saved",
          description: "Your progress has been automatically saved",
          variant: "default",
          duration: 2000,
        });
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(timer);
  }, [form, lineItems, isDirty, toast]);

  // Mark form as dirty when values change
  useEffect(() => {
    const subscription = form.watch(() => setIsDirty(true));
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    setIsDirty(true);
  }, [lineItems]);

  const onSubmit = (data: POFormData) => {
    if (lineItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one line item",
        variant: "destructive"
      });
      return;
    }

    // Validate line items
    const invalidItems = lineItems.filter(item => 
      !item.item_name || 
      !item.quantity || 
      item.quantity <= 0 || 
      !item.basic_rate || 
      parseFloat(item.basic_rate) <= 0
    );

    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error", 
        description: `Please fill all required fields for all line items. ${invalidItems.length} item(s) have missing or invalid data.`,
        variant: "destructive"
      });
      return;
    }

    const items: InsertPfOrderItems[] = lineItems.map(({ tempId, ...item }) => ({
      ...item,
      po_id: 0
    }));

    const processedData = {
      ...data,
      serving_distributor: data.serving_distributor === "none" ? undefined : data.serving_distributor
    };

    createPoMutation.mutate({ po: processedData, items });
  };

  const { totalQuantity, totalBasicAmount, totalGstAmount, totalValue } = calculatedTotals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation/Breadcrumb Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Purchase Orders</span>
            <span>›</span>
            <span className="text-slate-900 dark:text-white font-medium">Create New PO</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Enhanced Header with Status */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:bg-slate-900/60 dark:border-slate-700/60 p-6 lg:p-8 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Create Purchase Order
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Fill in the details below to create a new purchase order
                </p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Auto-save Status */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200/60 dark:bg-slate-800/80 dark:border-slate-600/60">
                {isDirty ? (
                  <Clock className="w-4 h-4 text-amber-500" />
                ) : lastSaved ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Save className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isDirty ? 'Unsaved changes' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved'}
                </span>
              </div>

              {/* Form Progress */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-sm border border-blue-200/60 dark:border-blue-700/60">
                <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {lineItems.length} items • ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Cards */}
        <Form {...form}>
          <form id="po-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Basic Information Card */}
            <Card className="shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200 dark:border-slate-700 overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/30 border-b">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-white shadow-sm">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          Basic Information
                          <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">Required</span>
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Core purchase order details and platform selection
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Company *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-sm border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 dark:border-slate-600 dark:hover:border-blue-500 transition-all duration-300">
                              <SelectValue placeholder="Select Company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyOptions.map((company) => (
                              <SelectItem key={company.value} value={company.value}>
                                {company.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="po_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PO Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter PO number"
                            className="h-12 border-slate-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Platform *
                        </FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-slate-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200">
                              <SelectValue placeholder="Select Platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-slate-200 dark:border-slate-700">
                            {filteredPlatforms.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                {selectedCompany ? `No platforms available for ${selectedCompany}` : "Select a company first"}
                              </div>
                            ) : (
                              filteredPlatforms.map((platform) => (
                                <SelectItem 
                                  key={platform.id} 
                                  value={platform.id.toString()}
                                  className="hover:bg-blue-50 focus:bg-blue-50 transition-colors"
                                >
                                  {platform.pf_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Status *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-slate-300 hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-slate-200 dark:border-slate-700">
                            {statusOptions.map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                className="hover:bg-green-50 focus:bg-green-50 transition-colors"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serving_distributor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Distributor
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-slate-300 hover:border-purple-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200">
                              <SelectValue placeholder="Select Distributor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-slate-200 dark:border-slate-700">
                            <SelectItem 
                              value="none"
                              className="hover:bg-purple-50 focus:bg-purple-50 transition-colors"
                            >
                              -- No Distributor --
                            </SelectItem>
                            {filteredDistributors.map((distributor) => (
                              <SelectItem 
                                key={distributor.id} 
                                value={distributor.distributor_name}
                                className="hover:bg-purple-50 focus:bg-purple-50 transition-colors"
                              >
                                {distributor.distributor_name}
                                {platforms.find(p => p.id === selectedPlatform)?.pf_name?.toLowerCase().includes('amazon') && 
                                 distributor.distributor_name.toUpperCase() === 'RK WORLD' && (
                                  <span className="ml-2 text-xs text-purple-600">(Amazon Default)</span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates Card */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/30 border-b">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-white shadow-sm">
                        <CalendarDays className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          Important Dates
                          <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">Timeline</span>
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Set key timeline milestones and deadlines
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="order_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Order Date *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DatePicker
                              date={field.value ? new Date(field.value) : undefined}
                              onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                              placeholder="Select order date"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Expiry Date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                            placeholder="Select expiry date"
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appointment_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Appointment Date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                            placeholder="Select appointment date"
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & Distribution Card */}
            <Card className="shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200 dark:border-slate-700 overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/30 dark:to-orange-800/30 border-b">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-white shadow-sm">
                        <MapPin className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          Location & Distribution
                          <span className="px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">Required</span>
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Delivery location and warehouse information
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Region *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-slate-300 hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200">
                              <SelectValue placeholder="Select Region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-slate-200 dark:border-slate-700">
                            {regionOptions.map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                className="hover:bg-orange-50 focus:bg-orange-50 transition-colors"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          State *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-slate-300 hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-slate-200 dark:border-slate-700">
                            {availableStates.length === 0 ? (
                              <SelectItem value="_" disabled>
                                Please select a region first
                              </SelectItem>
                            ) : (
                              availableStates.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                  className="hover:bg-orange-50 focus:bg-orange-50 transition-colors"
                                >
                                  {option.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          City *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-slate-300 hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200">
                              <SelectValue placeholder="Select City" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-slate-200 dark:border-slate-700">
                            {availableCities.length === 0 ? (
                              <SelectItem value="_" disabled>
                                Please select a state first
                              </SelectItem>
                            ) : (
                              availableCities.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                  className="hover:bg-orange-50 focus:bg-orange-50 transition-colors"
                                >
                                  {option.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Area
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter area/locality"
                            className="h-12 border-slate-300 hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dispatch_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Dispatch From
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-slate-300 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200">
                              <SelectValue placeholder="Select Dispatch Location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-slate-200 dark:border-slate-700">
                            {dispatchFromOptions.map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                className="hover:bg-indigo-50 focus:bg-indigo-50 transition-colors"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warehouse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Warehouse className="h-4 w-4" />
                          Warehouse
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter warehouse name"
                            className="h-12 border-slate-300 hover:border-cyan-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>


          </form>
        </Form>
      </div>

      {/* Line Items Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Card className="shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200 dark:border-slate-700 overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/30 border-b">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm">
                    <Package className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                      Order Items
                      <span className="px-3 py-1 text-sm font-medium text-emerald-600 bg-emerald-100 rounded-full">
                        {lineItems.length} items
                      </span>
                    </CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Add and manage your purchase order items • Total: ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={addLineItem} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
          </div>

          <CardContent className="p-6">
            {lineItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                  <Package className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No items added yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  Start building your purchase order by adding items. You can search from thousands of available products.
                </p>
                <Button 
                  onClick={addLineItem} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Item
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {lineItems.map((item) => (
                    <LineItemRow
                      key={item.tempId}
                      item={item}
                      platformId={form.watch("platform")}
                      onUpdate={(updates) => updateLineItem(item.tempId, updates)}
                      onRemove={() => removeLineItem(item.tempId)}
                    />
                  ))}
                </div>
                
                {/* Enhanced Summary */}
                <div className="mt-8 border-t bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-700/50 p-8 rounded-xl">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex flex-wrap gap-8">
                      <div className="text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-3">
                          <Package className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{lineItems.length}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Items</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-3">
                          <span className="text-lg font-bold text-blue-600">{totalQuantity}</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalQuantity}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Units</div>
                      </div>
                    </div>
                    <div className="text-center lg:text-right">
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Grand Total</div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                        ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Including all taxes</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attachments & Comments and Order Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Attachments & Comments */}
          <Card className="shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200 dark:border-slate-700 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                ATTACHMENTS & COMMENTS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
                  selectedFile 
                    ? 'border-green-400 bg-green-50 hover:border-green-500' 
                    : 'border-slate-300 hover:border-blue-400'
                }`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-white border-2 border-green-200 rounded-xl shadow-sm">
                      {getFileIcon(selectedFile.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click to change
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        form.setValue("attachment", "");
                        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Click to Attach PO Document</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
                    </div>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check file size (max 10MB)
                      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                      if (file.size > maxSize) {
                        toast({
                          title: "File too large",
                          description: "Please select a file smaller than 10MB",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Set the selected file
                      setSelectedFile(file);
                      
                      // Update form with file name (you might want to upload to server and store URL)
                      form.setValue("attachment", file.name);
                      setIsDirty(true);
                      
                      toast({
                        title: "File selected",
                        description: `Selected: ${file.name}`,
                        variant: "default"
                      });
                    }
                  }}
                />
              </div>

              {/* Comments Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  COMMENTS
                </label>
                <textarea
                  placeholder="ENTER ANY ADDITIONAL COMMENTS, SPECIAL INSTRUCTIONS, OR NOTES ABOUT THIS PURCHASE ORDER..."
                  className="w-full min-h-[120px] px-4 py-3 border-2 border-slate-200 rounded-lg resize-none hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  maxLength={1000}
                />
                <div className="text-xs text-slate-500 mt-2">
                  Maximum 1000 characters. Comments will be saved with timestamp.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200 dark:border-slate-700 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                ORDER SUMMARY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-600">Total Basic Amount:</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    ₹{totalBasicAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-600">Total Tax (GST):</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    ₹{totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-600">Total Items:</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {lineItems.length} ({totalQuantity} units)
                  </span>
                </div>

                <div className="flex justify-between items-center py-4 border-t-2 border-slate-900">
                  <span className="text-lg font-bold text-slate-900">Grand Total:</span>
                  <span className="text-2xl font-bold text-slate-900">
                    ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Create Order Button */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                <Button 
                  type="submit" 
                  form="po-form"
                  disabled={createPoMutation.isPending || lineItems.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  {createPoMutation.isPending ? (
                    <>
                      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Purchase Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-3 h-5 w-5" />
                      CREATE PURCHASE ORDER
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-slate-600 mt-3">
                  By creating this order, you confirm all details are accurate
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need help? Contact support or check the documentation for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}