import { render, screen, waitFor } from "@testing-library/react";
import VoiceRoom from "@/ui/voice/VoiceRoom";
import { backendFetch } from "@/lib/backend-client";

jest.mock("@/lib/backend-client", () => ({
  backendFetch: jest.fn(),
  extractErrorMessage: jest.fn().mockResolvedValue("No se pudo conectar al canal de voz"),
}));

jest.mock("@livekit/components-react", () => ({
  LiveKitRoom: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="livekit-room" data-token={props.token} data-server-url={props.serverUrl}>
      {children}
    </div>
  ),
  VideoConference: () => <div data-testid="video-conference" />,
  useRoomContext: () => ({
    state: "disconnected",
    localParticipant: { name: "", setName: jest.fn() },
    on: jest.fn(),
    off: jest.fn(),
  }),
}));

jest.mock("@livekit/components-styles", () => ({}));
jest.mock("livekit-client", () => ({
  RoomEvent: { Connected: "connected" },
}));

const mockBackendFetch = backendFetch as jest.MockedFunction<typeof backendFetch>;

describe("VoiceRoom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the LiveKitRoom after token is fetched", async () => {
    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        token: "test-token-123",
        url: "wss://livekit.example.com",
      }),
    } as unknown as Response);

    render(<VoiceRoom channelId="channel-1" userId="user-1" displayName="TestUser" />);

    await waitFor(() => {
      expect(screen.getByTestId("livekit-room")).toBeInTheDocument();
    });
  });

  it("fetches token on mount with the correct parameters", async () => {
    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        token: "test-token-123",
        url: "wss://livekit.example.com",
      }),
    } as unknown as Response);

    render(<VoiceRoom channelId="ch-42" userId="user-99" displayName="Player" />);

    await waitFor(() => {
      expect(mockBackendFetch).toHaveBeenCalledWith(
        "/api/voice/join",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identity: "user-99",
            room: "channel-ch-42",
            name: "Player",
          }),
        }),
      );
    });
  });

  it("shows error message when fetch fails", async () => {
    mockBackendFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Unauthorized" }),
    } as unknown as Response);

    const { extractErrorMessage } = jest.requireMock("@/lib/backend-client");
    extractErrorMessage.mockResolvedValue("No se pudo conectar al canal de voz");

    render(<VoiceRoom channelId="channel-1" userId="user-1" />);

    await waitFor(() => {
      expect(
        screen.getByText("No se pudo conectar al canal de voz"),
      ).toBeInTheDocument();
    });
  });

  it("shows retry button on error", async () => {
    mockBackendFetch.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Error" }),
    } as unknown as Response);

    const { extractErrorMessage } = jest.requireMock("@/lib/backend-client");
    extractErrorMessage.mockResolvedValue("No se pudo conectar al canal de voz");

    render(<VoiceRoom channelId="channel-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Reintentar")).toBeInTheDocument();
    });
  });

  it("renders VideoConference component inside LiveKitRoom", async () => {
    mockBackendFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        token: "test-token-123",
        url: "wss://livekit.example.com",
      }),
    } as unknown as Response);

    render(<VoiceRoom channelId="channel-1" userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByTestId("video-conference")).toBeInTheDocument();
    });
  });
});
