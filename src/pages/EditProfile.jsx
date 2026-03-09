import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Check, Trash2 } from "lucide-react";

const positions = ["Center", "Left Wing", "Right Wing", "Defenseman", "Goalie"];

export default function EditProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", position: "", username: "", photo_url: "", height: "", weight: "" });
  const [usernameError, setUsernameError] = useState("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["profile-edit", profileId],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Profile.filter({ 
        id: profileId,
        created_by: currentUser.email 
      });
    },
    enabled: !!profileId,
  });

  useEffect(() => {
    if (profiles.length > 0) {
      const p = profiles[0];
      setForm({
        name: p.name || "",
        age: p.age?.toString() || "",
        position: p.position || "",
        username: p.username || "",
        photo_url: p.photo_url || "",
        height: p.height || "",
        weight: p.weight?.toString() || "",
      });
    }
  }, [profiles]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Profile.update(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setSaved(true);
      setTimeout(() => window.location.href = createPageUrl("Profile"), 800);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Profile.delete(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      window.location.href = createPageUrl("Home");
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, photo_url: file_url }));
  };

  const handleUsernameChange = async (value) => {
    setForm((f) => ({ ...f, username: value }));
    setUsernameError("");
    
    if (!value.trim()) return;
    
    const response = await base44.functions.invoke('checkUsername', { username: value });
    if (!response.data.available) {
      setUsernameError("That username is already taken");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (usernameError) return;
    updateMutation.mutate({ 
      ...form, 
      age: form.age ? parseInt(form.age) : undefined,
      weight: form.weight ? parseInt(form.weight) : undefined
    });
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-white font-bold text-xl">Updated!</h2>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <div className="w-24 h-24 rounded-2xl bg-slate-800/60 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
              {form.photo_url ? (
                <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>

        <div>
          <Label className="text-slate-400 text-xs mb-1.5 block">Player Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
        </div>
        <div>
          <Label className="text-slate-400 text-xs mb-1.5 block">Username</Label>
          <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
        </div>
        <div>
          <Label className="text-slate-400 text-xs mb-1.5 block">Position</Label>
          <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}>
            <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {positions.map((p) => <SelectItem key={p} value={p} className="text-white focus:bg-slate-700">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Age</Label>
            <Input type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Height</Label>
            <Input placeholder='6&#39;2"' value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Weight (lbs)</Label>
            <Input type="number" placeholder="185" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
          </div>
        </div>

        <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl h-12">
          {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save Changes"}
        </Button>

        <Button type="button" variant="ghost" onClick={() => { if (confirm("Delete this profile?")) deleteMutation.mutate(); }} className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-12">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Profile
        </Button>
      </form>
    </div>
  );
}