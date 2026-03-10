import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Users, Check, X, Clock, AlertCircle, UserMinus } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Friends() {
  const [searchUsername, setSearchUsername] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [addMessage, setAddMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null); // { id, name }
  const queryClient = useQueryClient();

  // Get the active profile ID
  const { data: activeProfileId } = useQuery({
    queryKey: ["activeProfileId"],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      const savedId = localStorage.getItem("activeProfileId");
      const profiles = await base44.entities.Profile.filter({ created_by: currentUser.email });
      if (savedId && profiles.find(p => p.id === savedId)) return savedId;
      return profiles[0]?.id || null;
    },
  });

  // Fetch all friend data via backend function (profile-level)
  const { data: friendData = { sent: [], received: [] }, isLoading } = useQuery({
    queryKey: ["friendRequests", activeProfileId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getFriendRequests', { profileId: activeProfileId });
      return res.data;
    },
    enabled: !!activeProfileId,
  });

  const pendingIncoming = friendData.received.filter(f => f.status === "pending");
  const pendingOutgoing = friendData.sent.filter(f => f.status === "pending");

  // Accepted connections: union of both sides
  const acceptedSent = friendData.sent.filter(f => f.status === "accepted");
  const acceptedReceived = friendData.received.filter(f => f.status === "accepted");
  const acceptedAll = [
    ...acceptedSent.map(f => ({ id: f.id, name: f.other_name, username: f.other_username, photo: f.other_photo, profileId: f.other_profile_id, side: 'sent' })),
    ...acceptedReceived.map(f => ({ id: f.id, name: f.other_name, username: f.other_username, photo: f.other_photo, profileId: f.other_profile_id, side: 'received' })),
  ];
  // Deduplicate by username, keeping first occurrence
  const seenUsernames = new Set();
  const accepted = acceptedAll.filter(f => {
    if (seenUsernames.has(f.username)) return false;
    seenUsernames.add(f.username);
    return true;
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: (username) => base44.functions.invoke('sendFriendRequest', { username, senderProfileId: activeProfileId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      setSearchUsername("");
      setFoundUser(null);
      setAddMessage("Friend request sent!");
      setErrorMessage("");
      setTimeout(() => setAddMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.error || error.message);
      setAddMessage("");
    },
  });

  const respondToRequestMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.functions.invoke('respondToFriendRequest', { friendRequestId: id, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friendRequests"] }),
  });

  const deleteFriendMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('removeFriend', { friendRecordId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      setConfirmRemove(null);
    },
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = searchUsername.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setFoundUser(null);
    setErrorMessage("");
    try {
      const res = await base44.functions.invoke('searchUser', { username: trimmed });
      setFoundUser(res.data.profile);
    } catch (err) {
      setFoundUser(null);
      setErrorMessage(err.response?.data?.error || "No user found.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = () => {
    if (foundUser) sendFriendRequestMutation.mutate(foundUser.username);
  };

  const Avatar = ({ name, photo, size = "w-10 h-10" }) => (
    photo
      ? <img src={photo} alt={name} className={`${size} rounded-full object-cover flex-shrink-0`} />
      : <div className={`${size} rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0`}>
          <span className="text-sky-400 font-bold">{name?.[0]?.toUpperCase() || "?"}</span>
        </div>
  );

  return (
    <div className="px-4 pb-24">
      {/* Remove Friend Confirmation */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center pb-10 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mx-auto mb-4">
              <UserMinus className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-white font-bold text-center text-lg mb-1">Remove Friend?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Are you sure you want to remove <span className="text-white font-medium">{confirmRemove.name}</span> from your friends?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFriendMutation.mutate(confirmRemove.id)}
                disabled={deleteFriendMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleteFriendMutation.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="py-4">
        <h1 className="text-white font-bold text-xl mb-4">Friends</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by username..."
              value={searchUsername}
              onChange={(e) => { setSearchUsername(e.target.value); setErrorMessage(""); setFoundUser(null); }}
              className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl pl-9"
            />
          </div>
          <Button type="submit" disabled={!searchUsername.trim() || isSearching} className="bg-sky-500 hover:bg-sky-600 rounded-xl">
            {isSearching
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Search className="w-4 h-4" />}
          </Button>
        </form>

        {/* Found User */}
        {foundUser && (() => {
          const alreadyPending = pendingOutgoing.some(f => f.other_username === foundUser.username);
          const alreadyFriend = accepted.some(f => f.username === foundUser.username);
          return (
            <div className="mb-4 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={foundUser.name} photo={foundUser.photo_url} />
                  <div>
                    <p className="text-white text-sm font-medium">{foundUser.name}</p>
                    <p className="text-slate-400 text-xs">@{foundUser.username}</p>
                  </div>
                </div>
                {alreadyFriend ? (
                  <span className="text-emerald-400 text-xs">Already friends</span>
                ) : alreadyPending ? (
                  <span className="text-slate-400 text-xs">Invite Pending</span>
                ) : (
                  <Button onClick={handleAddFriend} disabled={sendFriendRequestMutation.isPending} className="bg-sky-500 hover:bg-sky-600 rounded-lg">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })()}

        {addMessage && (
          <div className="bg-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-2 mb-4 text-center">{addMessage}</div>
        )}
        {errorMessage && (
          <div className="bg-red-500/20 text-red-400 text-sm rounded-xl px-4 py-2 mb-4 text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />{errorMessage}
          </div>
        )}

        {/* Incoming Pending Requests */}
        {pendingIncoming.length > 0 && (
          <div className="mb-6">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Friend Requests ({pendingIncoming.length})
            </h3>
            <div className="space-y-2">
              {pendingIncoming.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.other_name} photo={f.other_photo} size="w-8 h-8" />
                     <div>
                       <p className="text-white text-sm font-medium">{f.other_name}</p>
                       <p className="text-slate-500 text-xs">@{f.other_username}</p>
                     </div>
                    </div>
                    <div className="flex gap-1">
                    <button
                      onClick={() => respondToRequestMutation.mutate({ id: f.id, status: "accepted" })}
                      disabled={respondToRequestMutation.isPending}
                      className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => respondToRequestMutation.mutate({ id: f.id, status: "declined" })}
                      disabled={respondToRequestMutation.isPending}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Pending Requests */}
        {pendingOutgoing.length > 0 && (
          <div className="mb-6">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Pending
            </h3>
            <div className="space-y-2">
              {pendingOutgoing.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.other_name} photo={f.other_photo} size="w-8 h-8" />
                     <div>
                       <p className="text-white text-sm font-medium">{f.other_name}</p>
                       <p className="text-slate-500 text-xs">@{f.other_username}</p>
                     </div>
                    </div>
                    <span className="text-slate-400 text-xs">Invite Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Friends */}
        <div>
          <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Friends ({accepted.length})
          </h3>
          {accepted.length === 0 && !isLoading ? (
            <EmptyState icon={Users} title="No friends yet" description="Search for friends by username to connect." />
          ) : (
            <div className="space-y-2">
              {accepted.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <Link
                    to={f.profileId ? createPageUrl("FriendProfile") + `?id=${f.profileId}` : "#"}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Avatar name={f.name} photo={f.photo} size="w-9 h-9" />
                    <div>
                      <p className="text-white text-sm font-medium">{f.name}</p>
                      <p className="text-slate-500 text-xs">@{f.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => setConfirmRemove({ id: f.id, name: f.name })}
                    className="text-slate-500 hover:text-red-400 transition-colors text-xs ml-3"
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