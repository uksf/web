// STUB data for the campaigns section visual prototype. No API — hardcoded sample
// data so the pages can be navigated in the running app to make design decisions.

export interface StubIntel {
    id: string;
    title: string;
    body: string;
}

export interface StubOp {
    id: string;
    title: string;
    status: 'Scheduled' | 'Complete';
    scheduledTime: string;
    server: string;
    map: string;
    mission: string;
    missionState: 'Present' | 'Missing';
    warno: string;
    intel: StubIntel[];
}

export interface StubCampaign {
    id: string;
    name: string;
    theatre: string;
    status: 'active' | 'archived';
    brief: string;
    ops: StubOp[];
    intel: StubIntel[];
}

const SAMPLE_INTEL = (id: string, title: string): StubIntel => ({
    id,
    title,
    body: '<p>Stub intel page body. Rich text (Quill) goes here — enemy strengths, terrain, ROE, etc.</p>'
});

export const STUB_CAMPAIGNS: StubCampaign[] = [
    {
        id: 'iron-sky',
        name: 'Operation Iron Sky',
        theatre: 'Takistan',
        status: 'active',
        brief:
            '<p><b>Situation.</b> Coalition forces push into the Takistan basin to disrupt insurgent supply running through the eastern passes.</p>' +
            '<p><b>Mission.</b> Over four operations the unit will secure the valley, deny the high ground, and dismantle the cell&rsquo;s logistics node.</p>' +
            "<p><b>Commander's intent.</b> Tempo over attrition &mdash; keep them reacting.</p>",
        intel: [SAMPLE_INTEL('i-cell', 'Enemy disposition — eastern cell'), SAMPLE_INTEL('i-terrain', 'Terrain & weather notes')],
        ops: [
            {
                id: 'op4',
                title: 'Op 4 — Break the Passes',
                status: 'Scheduled',
                scheduledTime: 'Sat 28 Jun, 19:00',
                server: 'Main Server',
                map: 'altis',
                mission: 'breakpasses.Altis.pbo',
                missionState: 'Present',
                warno:
                    '<p><b>1. Situation.</b> Insurgent platoon dug in across the two eastern passes; technicals reported.</p>' +
                    '<p><b>2. Mission.</b> Seize both passes NLT 21:00 to enable the logistics raid in Op 5.</p>' +
                    '<p><b>3. Execution.</b> Two-troop assault, mortar support on call, air on station from H+20.</p>',
                intel: [SAMPLE_INTEL('op4-def', 'Pass defences — sketch & ranges')]
            },
            {
                id: 'op3',
                title: 'Op 3 — Deny the Ridge',
                status: 'Complete',
                scheduledTime: 'Sat 21 Jun, 19:00',
                server: 'Main Server',
                map: 'tanoa',
                mission: 'denyridge.Tanoa.pbo',
                missionState: 'Present',
                warno: '<p>WARNO archived — see AAR for the after-action.</p>',
                intel: []
            }
        ]
    },
    {
        id: 'cold-harbour',
        name: 'Operation Cold Harbour',
        theatre: 'Livonia',
        status: 'active',
        brief: '<p><b>Situation.</b> Winter insertion to recover downed ISR assets before the thaw.</p>',
        intel: [SAMPLE_INTEL('ch-rec', 'Recovery site overview')],
        ops: [
            {
                id: 'op1',
                title: 'Op 1 — Cold Open',
                status: 'Scheduled',
                scheduledTime: 'Sat 5 Jul, 19:00',
                server: 'Main Server',
                map: 'enoch',
                mission: 'coldopen.Enoch.pbo',
                missionState: 'Missing',
                warno: '<p>Draft WARNO — mission file not yet uploaded.</p>',
                intel: []
            }
        ]
    },
    {
        id: 'red-dawn',
        name: 'Operation Red Dawn',
        theatre: 'Chernarus',
        status: 'archived',
        brief: '<p>Completed campaign. Six operations, full arc closed out.</p>',
        intel: [],
        ops: [
            {
                id: 'rd6',
                title: 'Op 6 — Last Light',
                status: 'Complete',
                scheduledTime: 'Sat 17 May, 19:00',
                server: 'Main Server',
                map: 'chernarus',
                mission: 'lastlight.Chernarus.pbo',
                missionState: 'Present',
                warno: '<p>Archived.</p>',
                intel: []
            }
        ]
    }
];

export function findCampaign(id: string): StubCampaign | undefined {
    return STUB_CAMPAIGNS.find((c) => c.id === id);
}

export function findOp(campaignId: string, opId: string): { campaign: StubCampaign; op: StubOp } | undefined {
    const campaign = findCampaign(campaignId);
    const op = campaign?.ops.find((o) => o.id === opId);
    return campaign && op ? { campaign, op } : undefined;
}
