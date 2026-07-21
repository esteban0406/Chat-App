package org.esteban_portafolio.Discol.users.Entity;

import java.util.UUID;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "account", uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "providerAccountId"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @NotBlank
    @Column(name = "provider", nullable = false)
    private String provider;

    @NotBlank
    @Column(name = "providerAccountId", nullable = false)
    private String providerAccountId;

    @Column(name = "accessToken", columnDefinition = "text")
    private String accessToken;

    @Column(name = "refreshToken", columnDefinition = "text")
    private String refreshToken;
}