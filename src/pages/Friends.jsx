import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Users, Check, X, Clock, AlertCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function Friends() {
  const [searchUsername, setSearchUsername] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // My outgoing requests and accepted friends (owned by me)
  const { data: myFriends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => base44.entities.Friend.list("-created_date"),
  });

  // Incoming pending requests (owned by others, targeting me)
  const { data: incomingData = { requests: [] }, isLoading: incomingLoading } = useQuery({
    queryKey: ["incomingRequests"],
    queryFn: () => base44.functions.invoke('getIncomingFriendRequests', {}).then(r => r.data),
    refetchInterval: 15000,
  });

  const incomingRequests = incomingData.requests || [];

  const sendFriendRequestMutation = useMutation({
    mutationFn: (username) =>
      base44.functions.invoke('sendFriendRequest', { username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["incomingRequests"] });
    },
  });

  const deleteFriendMutation = useMutation({
    mutationFn: (id) => base44.entities.Friend.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
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
    if (foundUser) {
      sendFriendRequestMutation.mutate(foundUser.username);
    }
  };

  const accepted = myFriends.filter((f) => f.status === "accepted");
  const pendingOutgoing = myFriends.filter((f) => f.status === "pending" && f.created_by === user?.email);

  return (
    <div className="px-4 pb-24">
      <div className="py-4">
        <h1 className="text-white font-bold text-xl mb-4">Friends</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by username..."
              value={searchUsername}
              onChange={(e) => {
                setSearchUsername(e.target.value);
                setErrorMessage("");
                setFoundUser(null);
              }}
              className="bg-slate-800/60 border-slate-700/50 text-white rounded-xl pl-9"
            />
          </div>
          <Button
            type="submit"
            disabled={!searchUsername.trim() || isSearching}
            className="bg-sky-500 hover:bg-sky-600 rounded-xl"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* Found User Result */}
        {foundUser && (
          <div className="mb-4 bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <span className="text-sky-400 font-bold">{foundUser.name?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{foundUser.name}</p>
                  <p className="text-slate-400 text-xs">@{foundUser.username}</p>
                </div>
              </div>
              <Button
                onClick={handleAddFriend}
                disabled={sendFriendRequestMutation.isPending}
                size="sm"
                className="bg-sky-500 hover:bg-sky-600 rounded-lg gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>
        )}

        {addMessage && (
          <div className="bg-emerald-500/20 text-emerald-400 text-sm rounded-xl px-4 py-2 mb-4 text-center">
            {addMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/20 text-red-400 text-sm rounded-xl px-4 py-2 mb-4 text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}

        {/* Incoming Friend Requests */}
        {incomingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Friend Requests ({incomingRequests.length})
            </h3>
            <div className="space-y-2">
              {incomingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-slate-800/60 border border-amber-500/30 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                      <span className="text-sky-400 text-xs font-bold">{req.sender_name?.[0]?.toUpperCase() || "?"}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{req.sender_name}</p>
                      <p className="text-slate-500 text-xs">@{req.sender_username}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => respondToRequestMutation.mutate({ id: req.id, status: "accepted" })}
                      disabled={respondToRequestMutation.isPending}
                      className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => respondToRequestMutation.mutate({ id: req.id, status: "declined" })}
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

        {/* Outgoing Pending */}
        {pendingOutgoing.length > 0 && (
          <div className="mb-6">
            <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Sent Requests
            </h3>
            <div className="space-y-2">
              {pendingOutgoing.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div>
                    <p className="text-white text-sm font-medium">{f.friend_name}</p>
                    <p className="text-slate-500 text-xs">Pending...</p>
                  </div>
                  <button
                    onClick={() => deleteFriendMutation.mutate(f.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                  >
                    Cancel
                  </button>
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
              description="Search for friends by username to connect with them."
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