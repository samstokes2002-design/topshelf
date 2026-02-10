import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Check } from "lucide-react";

const positions = ["Center", "Left Wing", "Right Wing", "Defenseman", "Goalie"];

export default function CreateProfile() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    position: "",
    username: "",
    photo_url: "",
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Profile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setSaved(true);
      setTimeout(() => {
        window.location.href = createPageUrl("Home");
      }, 800);
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, photo_url: file_url }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
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
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
          />
        </div>

        <div>
          <Label className="text-slate-400 text-xs mb-1.5 block">Username</Label>
          <Input
            placeholder="@username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl"
          />
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

        <Button
          type="submit"
          disabled={!form.name || !form.position || mutation.isPending}
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