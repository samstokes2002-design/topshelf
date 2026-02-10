import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Users, Check, X, Clock } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export default function Friends() {
  const [searchEmail, setSearchEmail] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: myFriends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => base44.entities.Friend.list("-created_date"),
  });

  const addFriendMutation = useMutation({
    mutationFn: (email) =>
      base44.entities.Friend.create({ friend_email: email, friend_name: email, status: "pending" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      setSearchEmail("");
      setAddMessage("Friend request sent!");
      setTimeout(() => setAddMessage(""), 3000);
    },
  });

  const updateFriendMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Friend.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });

  const deleteFriendMutation = useMutation({
    mutationFn: (id) => base44.entities.Friend.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (searchEmail.trim()) {
      addFriendMutation.mutate(searchEmail.trim());
    }
  };

  const accepted = myFriends.filter((f) => f.status === "accepted");
  const pending = myFriends.filter((f) => f.status === "pending");

  return (
    <div className="px-4 pb-24">
      <div className="py-4">
        <h1 className="text-white font-bold text-xl mb-4">Friends</h1>

        {/* Add Friend */}
        <form onSubmit={handleAddFriend} className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Add by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl pl-9"
            />
          </div>
          <Button
            type="submit"
            disabled={!searchEmail.trim() || addFriendMutation.isPending}
            className="bg-sky-500 hover:bg-sky-600 rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </form>

        {addMessage && (
          <div className="bg-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-2 mb-4 text-center">
            {addMessage}
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Pending
            </h3>
            <div className="space-y-2">
              {pending.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div>
                    <p className="text-white text-sm font-medium">{friend.friend_name || friend.friend_email}</p>
                    <p className="text-slate-500 text-xs">{friend.friend_email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateFriendMutation.mutate({ id: friend.id, status: "accepted" })}
                      className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFriendMutation.mutate(friend.id)}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Friends */}
        <div>
          <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            Friends ({accepted.length})
          </h3>
          {accepted.length === 0 && !isLoading ? (
            <EmptyState
              icon={Users}
              title="No friends yet"
              description="Add friends by email to see their activity."
            />
          ) : (
            <div className="space-y-2">
              {accepted.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-500/20 flex items-center justify-center">
                      <span className="text-sky-400 text-sm font-bold">
                        {(friend.friend_name || friend.friend_email)?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{friend.friend_name || friend.friend_email}</p>
                      <p className="text-slate-500 text-xs">{friend.friend_email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFriendMutation.mutate(friend.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}