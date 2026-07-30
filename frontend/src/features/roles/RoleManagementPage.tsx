import { Shield } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface RoleDefinition {
  name: string;
  level: number;
  color: "success" | "info" | "warning" | "danger" | "neutral";
  description: string;
  permissions: string[];
}

const ROLES: RoleDefinition[] = [
  {
    name: "SUPER_ADMIN",
    level: 5,
    color: "danger",
    description: "Full platform access. Can manage all resources and users.",
    permissions: [
      "All tournament operations",
      "User management & role assignment",
      "Platform settings",
      "Delete any resource",
    ],
  },
  {
    name: "TOURNAMENT_ADMIN",
    level: 4,
    color: "warning",
    description: "Manages tournaments, teams, players, and auction sessions.",
    permissions: [
      "Create & manage tournaments",
      "Approve team registrations",
      "Manage player list",
      "Conduct auctions",
      "Suspend users (below SUPER_ADMIN)",
    ],
  },
  {
    name: "OWNER",
    level: 3,
    color: "info",
    description: "Franchise owner. Participates in auctions to build a team.",
    permissions: [
      "Place bids in auctions",
      "Manage own team roster",
      "Assign CAPTAIN to player",
      "View match schedules",
    ],
  },
  {
    name: "CAPTAIN",
    level: 2,
    color: "info",
    description: "Team captain. Leads the team during matches.",
    permissions: [
      "View team roster",
      "Manage playing XI for matches",
      "Submit score (if scorer role granted)",
    ],
  },
  {
    name: "PLAYER",
    level: 1,
    color: "neutral",
    description: "Registered player available for auction and matches.",
    permissions: [
      "View own profile & stats",
      "View tournament schedule",
      "Participate when assigned to a team",
    ],
  },
  {
    name: "SPECTATOR",
    level: 0,
    color: "neutral",
    description: "Default role. Read-only access to public tournament data.",
    permissions: [
      "View public tournament info",
      "Watch live scores (read-only)",
    ],
  },
];

export function RoleManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
        <p className="text-sm text-gray-500">
          Platform roles and their permission boundaries
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                  <Shield className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{role.name}</CardTitle>
                    <Badge variant={role.color}>Level {role.level}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                </div>
              </div>
            </CardHeader>

            <ul className="space-y-1.5">
              {role.permissions.map((perm) => (
                <li key={perm} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500">✓</span>
                  {perm}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-2 flex-wrap text-sm text-gray-600">
          {[...ROLES]
            .sort((a, b) => b.level - a.level)
            .map((r, i, arr) => (
              <span key={r.name} className="flex items-center gap-2">
                <Badge variant={r.color}>{r.name}</Badge>
                {i < arr.length - 1 && <span className="text-gray-400">›</span>}
              </span>
            ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Higher-level roles inherit all permissions of lower-level roles in the same context.
        </p>
      </Card>
    </div>
  );
}
