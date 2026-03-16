import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Check, ShieldAlert } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
import { validateContentFields } from "@/components/contentFilter";
import FilteredInput from "@/components/FilteredInput";
import { createPageUrl } from "@/utils";

const positions = ["Center", "Left Wing", "Right Wing", "Defenseman", "Goalie"];

export default function CreateProfile() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [contentError, setContentError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    position: "",
    username: "",
    photo_url: "",
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createProfile', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setSaved(true);
      setTimeout(() => {
        window.location.href = createPageUrl("SeasonSetup") + `?profileId=${response.data.id}`;
      }, 800);
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        setUsernameError("That username is already taken.");
      } else {
        setUsernameError("Error creating profile. Please try again.");
      }
    },
  });

  const checkUsernameUniqueness = async (username) => {
    if (!username.trim()) {
      setUsernameError("");
      return true;
    }

    setCheckingUsername(true);
    try {
      const response = await base44.functions.invoke('checkUsername', { username });
      if (!response.data.available) {
        setUsernameError("That username is already taken.");
        setCheckingUsername(false);
        return false;
      }
      setUsernameError("");
      setCheckingUsername(false);
      return true;
    } catch {
      setUsernameError("");
      setCheckingUsername(false);
      return true;
    }
  };

  const handleUsernameChange = (value) => {
    setForm((f) => ({ ...f, username: value }));
    setUsernameError("");
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.username.trim()) {
      setUsernameError("Username is required");
      return;
    }

    const contentErr = validateContentFields({
      "name": form.name,
      "username": form.username,
    });
    if (contentErr) { setContentError(contentErr); return; }
    setContentError("");

    const isUnique = await checkUsernameUniqueness(form.username);
    if (!isUnique) return;

    mutation.mutate({
      ...form,
      username: form.username.toLowerCase().trim(),
      age: form.age ? parseInt(form.age) : undefined,
    });
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-white font-bold text-xl">Profile Created!</h2>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {cropFile && (
        <ImageCropper file={cropFile} onCrop={handleCropDone} onCancel={() => setCropFile(null)} />
      )}
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => window.history.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Create Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo */}
        <div className="flex justify-center">
          <label className="cursor-pointer group">
            <div className="w-24 h-24 rounded-2xl bg-slate-800/60 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden hover:border-sky-500/50 transition-colors">
              {form.photo_url ? (
                <img src={form.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-slate-500 group-hover:text-sky-400 transition-colors" />
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <p className="text-xs text-slate-500 text-center mt-2">Add photo</p>
          </label>
        </div>

        <div>
          <Label className="text-slate-400 text-xs mb-1.5 block">Player Name *</Label>
          <FilteredInput
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
          />
        </div>

        <div>
          <Label className="text-slate-400 text-xs mb-1.5 block">Username *</Label>
          <FilteredInput
            placeholder="@username"
            value={form.username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            onBlur={() => form.username && checkUsernameUniqueness(form.username)}
            className={`bg-slate-800/60 border-slate-700/50 text-white rounded-xl ${usernameError ? "border-red-500/50" : ""}`}
          />
          {usernameError && (
            <p className="text-red-400 text-xs mt-1.5">{usernameError}</p>
          )}
          {checkingUsername && (
            <p className="text-slate-400 text-xs mt-1.5">Checking availability...</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Position *</Label>
            <Select value={form.position} onValueChange={(v) => setForm((f) => ({ ...f, position: v }))}>
              <SelectTrigger className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {positions.map((p) => (
                  <SelectItem key={p} value={p} className="text-white focus:bg-slate-700">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400 text-xs mb-1.5 block">Age</Label>
            <Input
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
            />
          </div>
        </div>

        {contentError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-1">
            <p className="text-red-400 text-sm">{contentError}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={!form.name || !form.position || !form.username || usernameError || mutation.isPending || checkingUsername}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl h-12 text-base"
        >
          {mutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Create Profile"
          )}
        </Button>
      </form>
    </div>
  );
}