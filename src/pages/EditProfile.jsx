import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Check, Trophy, Plus, Eye } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";

const positions = ["Center", "Left Wing", "Right Wing", "Defenseman", "Goalie"];

export default function EditProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", position: "", username: "", photo_url: "", height: "", weight: "", city: "", country: "", level: "", age_group: "", show_on_profile: false });
  const [usernameError, setUsernameError] = useState("");
  const [cropFile, setCropFile] = useState(null);

  const { data: seasons = [], refetch: refetchSeasons } = useQuery({
    queryKey: ["seasons-edit", profileId],
    queryFn: () => base44.entities.Season.filter({ profile_id: profileId }, "-created_date"),
    enabled: !!profileId,
  });

  const activateSeasonMutation = useMutation({
    mutationFn: async (seasonId) => {
      const otherActive = seasons.filter(s => s.id !== seasonId && s.is_active);
      await Promise.all(otherActive.map(s => base44.entities.Season.update(s.id, { is_active: false })));
      await base44.entities.Season.update(seasonId, { is_active: true });
    },
    onSuccess: () => refetchSeasons(),
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: (seasonId) => base44.entities.Season.delete(seasonId),
    onSuccess: () => refetchSeasons(),
  });

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
        city: p.city || "",
        country: p.country || "",
        level: p.level || "",
        age_group: p.age_group || "",
        show_on_profile: p.show_on_profile || false,
      });
    }
  }, [profiles]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('updateProfile', { profileId, ...data });
      if (response.status === 409) {
        throw new Error(response.data.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setSaved(true);
      setTimeout(() => window.location.href = createPageUrl("Profile"), 800);
    },
    onError: (error) => {
      if (error.message.includes("already taken")) {
        setUsernameError(error.message);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Profile.delete(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      window.location.href = createPageUrl("Home");
    },
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropFile(file);
    e.target.value = "";
  };

  const handleCropDone = async (croppedFile) => {
    setCropFile(null);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
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
      {cropFile && (
        <ImageCropper file={cropFile} onCrop={handleCropDone} onCancel={() => setCropFile(null)} />
      )}
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center">
          <label className="cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-slate-800/60 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
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
          <Input 
            value={form.username} 
            onChange={(e) => handleUsernameChange(e.target.value)} 
            className={`bg-slate-800/60 text-white rounded-xl ${usernameError ? 'border-red-500/50' : 'border-slate-700/50'}`}
          />
          {usernameError && <p className="text-red-400 text-xs mt-1.5">{usernameError}</p>}
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">City</Label>
            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Calgary" className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Country</Label>
            <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="Canada" className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Level</Label>
            <Input value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} placeholder="e.g. AAA, Junior, Rec" className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Age Group</Label>
            <Input value={form.age_group} onChange={(e) => setForm((f) => ({ ...f, age_group: e.target.value }))} placeholder="e.g. U18, Adult" className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, show_on_profile: !f.show_on_profile }))}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
            form.show_on_profile
              ? "bg-sky-500/20 border-sky-500/50 text-sky-400"
              : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600"
          }`}
        >
          <Eye className="w-4 h-4" />
          {form.show_on_profile ? "Showing on Profile" : "Show on Profile"}
        </button>

        <Button type="submit" disabled={updateMutation.isPending || !!usernameError} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed">
          {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save Changes"}
        </Button>

        {/* Seasons Section */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Seasons</h3>
            <button
              type="button"
              onClick={() => window.location.href = createPageUrl("SeasonSetup") + `?profileId=${profileId}`}
              className="text-sky-400 hover:text-sky-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {seasons.length === 0 ? (
            <p className="text-slate-500 text-xs">No seasons yet</p>
          ) : (
            <div className="space-y-2">
              {seasons.map((season) => (
                <div key={season.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-sky-400" />
                    <div>
                      <p className="text-white text-sm font-medium">{season.season_year}</p>
                      {season.team_name && <p className="text-slate-400 text-xs">{season.team_name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {season.is_active ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-sky-500/20 text-sky-400">Active</span>
                    ) : (
                      <Button size="sm" type="button" onClick={() => activateSeasonMutation.mutate(season.id)} disabled={activateSeasonMutation.isPending} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs rounded-lg h-7 px-3">
                        Activate
                      </Button>
                    )}
                    <Button size="sm" type="button" onClick={() => window.location.href = createPageUrl("SeasonSetup") + `?editId=${season.id}`} className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs rounded-lg h-7 px-3">
                      Edit
                    </Button>
                    <Button size="sm" type="button" onClick={() => { if (confirm("Delete this season?")) deleteSeasonMutation.mutate(season.id); }} disabled={deleteSeasonMutation.isPending} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg h-7 px-3">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </form>
    </div>
  );
}