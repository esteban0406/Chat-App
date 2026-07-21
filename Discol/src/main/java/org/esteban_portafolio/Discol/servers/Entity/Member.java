package org.esteban_portafolio.Discol.servers.Entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.esteban_portafolio.Discol.users.Entity.User;

@Entity
@Table(name = "member", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "serverId"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "serverId", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Server server;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roleId", nullable = true)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Role role;

    @CreationTimestamp
    @Column(name = "joinedAt", updatable = false, nullable = false)
    private Instant joinedAt;
}