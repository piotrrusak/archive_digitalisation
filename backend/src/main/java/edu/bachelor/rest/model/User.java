package edu.bachelor.rest.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Table(name="users")
public class User {

    @Id
    @Column(nullable = false, unique = true)
    private Long id;

    @Column(nullable = false, unique = true)
    private String mail;

    @Column(nullable = true, unique = true)
    private String username;

    @Column(nullable = true)
    private String firstName;

    @Column(nullable = true)
    private String lastName;

}