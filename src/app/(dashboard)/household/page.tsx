"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle,
  Crown,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

function HouseholdContent() {
  const searchParams = useSearchParams();
  const inviteTokenFromUrl = searchParams.get("inviteToken");

  const [household, setHousehold] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Household settings state
  const [householdName, setHouseholdName] = useState("");
  const [householdSize, setHouseholdSize] = useState(2);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    fetchHouseholdData();
    if (inviteTokenFromUrl) {
      handleAcceptUrlInvite(inviteTokenFromUrl);
    }
  }, [inviteTokenFromUrl]);

  const fetchHouseholdData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/household");
      if (res.ok) {
        const data = await res.json();
        setHousehold(data.household);
        setMembers(data.members || []);
        if (data.household) {
          setHouseholdName(data.household.name);
          setHouseholdSize(data.household.householdSize || 2);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptUrlInvite = async (token: string) => {
    try {
      const res = await fetch("/api/household/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "accept" }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage("You have successfully joined the household!");
        fetchHouseholdData();
      } else {
        setFeedbackMessage(data.error || "Failed to accept invite");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);
    setCreatedInviteLink(null);

    try {
      const res = await fetch("/api/household/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invitation");

      setCreatedInviteLink(data.invitation.inviteLink);
      setInviteEmail("");
    } catch (err: any) {
      setFeedbackMessage(err.message || "Invitation error");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInviteLink) return;
    navigator.clipboard.writeText(createdInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUpdateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: householdName,
          householdSize: Number(householdSize),
          currency: household?.currency || "USD",
        }),
      });
      if (res.ok) {
        setFeedbackMessage("Household configuration updated.");
        fetchHouseholdData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          Household Collaboration
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Share grocery lists, pantry inventory, and consumption tracking with roommates or family members.
        </p>
      </div>

      {feedbackMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Members List */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-700" />
                <h2 className="text-base font-bold text-stone-900">Household Members</h2>
              </div>
              <Badge variant="success">{members.length} Active</Badge>
            </div>

            <div className="divide-y divide-stone-100">
              {members.map((m) => (
                <div key={m.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-stone-900">{m.name}</span>
                      {m.role === "owner" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Crown className="h-3 w-3" /> Owner
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                          Member
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-400">{m.email}</span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    Joined {formatDate(m.joinedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Invite Member Box */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <UserPlus className="h-5 w-5 text-emerald-700" />
              <h2 className="text-base font-bold text-stone-900">Invite Roommate or Partner</h2>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-3 text-stone-400" />
                    <Input
                      type="email"
                      required
                      placeholder="roommate@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs text-stone-800"
                  >
                    <option value="member">Member</option>
                    <option value="owner">Co-Owner</option>
                  </select>
                </div>
              </div>

              <Button type="submit" size="sm" isLoading={isInviting}>
                <Share2 className="h-3.5 w-3.5" /> Generate Invitation Link
              </Button>
            </form>

            {createdInviteLink && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 mt-3">
                <span className="text-xs font-bold text-emerald-900 block">
                  Invitation Link Generated (Valid for 7 days):
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={createdInviteLink}
                    className="bg-white text-xs font-mono"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0">
                    {copiedLink ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Household Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="text-sm font-bold text-stone-900">
                Household Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUpdateHousehold} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Household Name
                  </label>
                  <Input
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Household Size (Residents)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Used by the deterministic restock engine to calculate daily burn rates.
                  </span>
                </div>

                <Button type="submit" size="sm" isLoading={isUpdating} className="w-full">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function HouseholdPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-stone-400">Loading household...</div>}>
      <HouseholdContent />
    </Suspense>
  );
}
